import { NodeType, ExpectationSpec } from './types';
import { TreeState } from '../state/TreeState';
import { RootSnapshot, SnapshotDiff } from '../helpers/types';
import { DuplicateAliasError, DuplicateNodeIdError } from './exceptions';

export abstract class Node {
  abstract readonly type: NodeType;

  /**
   * Internal state reference for sugar-coated API.
   * Managed by the tree root.
   */
  private _treeState: TreeState | null = null;
  private _rootNode: RootNode | null = null;

  /**
   * Returns the children of the node.
   */
  abstract get children(): readonly Node[];

  /**
   * Internal: attach tree state for stateful API.
   */
  _attachState(state: TreeState, root: RootNode): void {
    this._treeState = state;
    this._rootNode = root;
  }

  /**
   * Get the current tree state.
   */
  protected get _state(): TreeState {
    if (!this._treeState) {
      throw new Error(
        'Node not attached to a tree state. Use TreeState.create() or node.asTree()'
      );
    }
    return this._treeState;
  }

  /**
   * Update the tree state (propagates to root).
   */
  protected _setState(newState: TreeState): void {
    if (!this._rootNode) {
      throw new Error('Node not attached to a tree');
    }
    this._rootNode._updateState(newState);
  }
}

type TreeListener = (event: TreeUpdateEvent) => void;

export interface TreeUpdateEvent {
  tree: RootNode;
  snapshot: RootSnapshot;
  previousSnapshot: RootSnapshot | null;
  diffs: SnapshotDiff[];
  state: TreeState;
}

export class RootNode extends Node {
  readonly type = 'ROOT';
  readonly child: Node | undefined;
  private _listeners = new Set<TreeListener>();
  private _aliasIndex = new Map<string, ExpectationNode>();
  private _aliasBuckets = new Map<ExpectationNode, Set<string>>();
  private _idIndex = new Map<string, ExpectationNode>();
  private _indexesDirty = true;

  constructor(child?: Node) {
    super();
    this.child = child;
    this._markIndexesDirty();
  }

  isEmpty(): boolean {
    return this.child === undefined;
  }

  get children(): readonly Node[] {
    return this.child ? [this.child] : [];
  }

  rebuildIndexes(): this {
    const aliasIndex = new Map<string, ExpectationNode>();
    const aliasBuckets = new Map<ExpectationNode, Set<string>>();
    const idIndex = new Map<string, ExpectationNode>();

    const aliasStack: string[] = [];

    const traverse = (node: Node): void => {
      let segmentsAdded = 0;
      if (node instanceof GroupNode && node.alias) {
        segmentsAdded = pushAliasSegments(aliasStack, node.alias);
      }

      if (node instanceof ExpectationNode) {
        if (idIndex.has(node.id)) {
          throw new DuplicateNodeIdError(node.id);
        }
        idIndex.set(node.id, node);

        const aliasKeys = collectAliasKeys(node, aliasStack);
        if (aliasKeys.size > 0) {
          aliasBuckets.set(node, aliasKeys);
          for (const key of aliasKeys) {
            const existing = aliasIndex.get(key);
            if (existing && existing !== node) {
              throw new DuplicateAliasError(key);
            }
            aliasIndex.set(key, node);
          }
        }
      }

      for (const child of node.children) {
        traverse(child);
      }

      if (segmentsAdded > 0) {
        aliasStack.length = aliasStack.length - segmentsAdded;
      }
    };

    if (this.child) {
      traverse(this.child);
    }

    this._aliasIndex = aliasIndex;
    this._aliasBuckets = aliasBuckets;
    this._idIndex = idIndex;
    this._indexesDirty = false;
    return this;
  }

  getNodeById(id: string): ExpectationNode | undefined {
    this._ensureIndexes();
    return this._idIndex.get(id);
  }

  getNodeByAlias(alias: string): ExpectationNode | undefined {
    this._ensureIndexes();
    return this._aliasIndex.get(alias);
  }

  getAliasesFor(node: ExpectationNode): string[] {
    this._ensureIndexes();
    return Array.from(this._aliasBuckets.get(node) ?? new Set());
  }

  private _ensureIndexes(): void {
    if (this._indexesDirty) {
      this.rebuildIndexes();
    }
  }

  private _markIndexesDirty(): void {
    this._indexesDirty = true;
    this._aliasIndex.clear();
    this._aliasBuckets.clear();
    this._idIndex.clear();
  }

  /**
   * Subscribe to state changes. Returns an unsubscribe function.
   * Listeners receive a {@link TreeUpdateEvent} detailing the latest snapshot,
   * diffs, and backing {@link TreeState} instance.
   */
  subscribe(listener: TreeListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Internal: update state and propagate to all nodes.
   */
  _updateState(newState: TreeState): void {
    const oldState = this['_treeState'] as TreeState | null; // Access via bracket notation to avoid TS error
    this._attachState(newState, this);
    this._propagateState(newState);

    // Notify listeners if state actually changed
    if (oldState !== newState) {
      this._notify({
        tree: this,
        snapshot: newState.snapshot,
        previousSnapshot: oldState ? oldState.snapshot : null,
        diffs: newState.diffs,
        state: newState,
      });
    }
  }

  /**
   * Notify all subscribers of state changes.
   */
  private _notify(event: TreeUpdateEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }

  /**
   * Propagate state to all child nodes recursively.
   */
  private _propagateState(state: TreeState): void {
    const visit = (node: Node) => {
      node._attachState(state, this);
      for (const child of node.children) {
        visit(child);
      }
    };
    if (this.child) {
      visit(this.child);
    }
  }

  /**
   * Initialize this tree with state management (sugar-coated API).
   * Optionally provide a precomputed {@link TreeState} (e.g. from
   * serialization).
   */
  initializeState(state?: TreeState): RootNode {
    const nextState = state ? state.rebind(this) : TreeState.create(this);
    this._updateState(nextState);
    return this;
  }

  hasState(): boolean {
    return Boolean(
      (this as unknown as { _treeState: TreeState | null })._treeState
    );
  }

  get treeState(): TreeState {
    const state = (this as unknown as { _treeState: TreeState | null })
      ._treeState;
    if (!state) {
      throw new Error(
        'Tree does not have state attached. Call initializeState() first.'
      );
    }
    return state;
  }

  /**
   * Get current tree status.
   */
  get status() {
    return this._state.status;
  }

  /**
   * Get current snapshot.
   */
  get snapshot() {
    return this._state.snapshot;
  }

  /**
   * Check if tree is fulfilled.
   */
  isFulfilled(): boolean {
    return this._state.isFulfilled();
  }

  /**
   * Check if tree is rejected.
   */
  isRejected(): boolean {
    return this._state.isRejected();
  }

  /**
   * Get diffs from previous state.
   */
  get diffs() {
    return this._state.diffs;
  }
}

export class GroupNode extends Node {
  readonly type = 'GROUP';
  readonly child: Node;
  readonly alias?: string;

  constructor(child: Node, alias?: string) {
    super();
    this.child = child;
    this.alias = alias;
  }

  get children(): readonly Node[] {
    return [this.child];
  }
}

export class ExpectationNode extends Node {
  readonly id: string;
  readonly type = 'EXPECTATION';

  /**
   * The specification of what this expectation node is expecting.
   * Contains all the details about what should be evaluated.
   */
  readonly spec: ExpectationSpec;

  /**
   * Optional metadata for tagging, grouping, and aliasing.
   */
  readonly alias?: string;
  readonly tags?: string[];
  readonly group?: string;

  constructor(id: string, spec: ExpectationSpec, metadata?: NodeMetadata) {
    super();
    this.id = id;
    this.spec = spec;
    this.alias = metadata?.alias;
    this.tags = metadata?.tags;
    this.group = metadata?.group;
  }

  get children(): readonly Node[] {
    return [];
  }

  /**
   * Mark this node as fulfilled (PASSED).
   * Sweet, joyful API! 🎉
   */
  fulfill(): void {
    const newState = this._state.fulfill(this.id);
    this._setState(newState);
  }

  /**
   * Mark this node as rejected (FAILED).
   */
  reject(): void {
    const newState = this._state.reject(this.id);
    this._setState(newState);
  }

  /**
   * Reset this node to PENDING.
   */
  reset(): void {
    const newState = this._state.reset(this.id);
    this._setState(newState);
  }

  /**
   * Fulfill this node asynchronously.
   * Useful for async validation, API calls, etc.
   */
  async fulfillAsync(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.fulfill();
    } catch (error) {
      this.reject();
      throw error;
    }
  }

  /**
   * Reject this node asynchronously.
   * Useful for async validation that should fail.
   */
  async rejectAsync(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.reject();
    } catch (error) {
      this.reject();
      throw error;
    }
  }

  /**
   * Evaluate an async condition and fulfill/reject based on result.
   */
  async evaluateAsync(fn: () => Promise<boolean>): Promise<void> {
    try {
      const result = await fn();
      if (result) {
        this.fulfill();
      } else {
        this.reject();
      }
    } catch (error) {
      this.reject();
      throw error;
    }
  }

  /**
   * Get the current status of this node.
   */
  get status() {
    return this._state.getNodeStatus(this.id);
  }

  /**
   * Check if this node is fulfilled.
   */
  isFulfilled(): boolean {
    return this.status === 'PASSED';
  }

  /**
   * Check if this node is rejected.
   */
  isRejected(): boolean {
    return this.status === 'FAILED';
  }

  /**
   * Check if this node is pending.
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }
}

/**
 * Metadata for node tagging, grouping, and aliasing.
 */
export interface NodeMetadata {
  alias?: string;
  tags?: string[];
  group?: string;
}

export class AndNode extends Node {
  readonly type = 'AND';
  readonly left: Node;
  readonly right: Node;

  constructor(left: Node, right: Node) {
    super();
    this.left = left;
    this.right = right;
  }

  get children(): readonly Node[] {
    return [this.left, this.right];
  }
}

export class OrNode extends Node {
  readonly type = 'OR';
  readonly left: Node;
  readonly right: Node;

  constructor(left: Node, right: Node) {
    super();
    this.left = left;
    this.right = right;
  }

  get children(): readonly Node[] {
    return [this.left, this.right];
  }
}

export class NotNode extends Node {
  readonly type = 'NOT';
  readonly child: Node;

  constructor(child: Node) {
    super();
    this.child = child;
  }

  get children(): readonly Node[] {
    return [this.child];
  }
}

function pushAliasSegments(stack: string[], alias: string): number {
  const segments = alias
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean);
  stack.push(...segments);
  return segments.length;
}

function collectAliasKeys(
  node: ExpectationNode,
  aliasStack: readonly string[]
): Set<string> {
  const keys = new Set<string>();
  const alias = node.alias?.trim();
  const aliasSegments = alias
    ? alias
        .split('.')
        .map(segment => segment.trim())
        .filter(Boolean)
    : [];

  if (alias) {
    keys.add(alias);
  }

  if (aliasSegments.length > 0) {
    keys.add(aliasSegments.join('.'));
  }

  if (aliasStack.length > 0 && aliasSegments.length > 0) {
    for (let start = 0; start < aliasStack.length; start += 1) {
      const combined = [...aliasStack.slice(start), ...aliasSegments]
        .map(segment => segment.trim())
        .filter(Boolean)
        .join('.');
      if (combined) {
        keys.add(combined);
      }
    }
  }

  return new Set(Array.from(keys).filter(Boolean));
}
