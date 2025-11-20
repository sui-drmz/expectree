import { RootNode, ExpectationNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
import { evaluateTree } from '../helpers/evaluateTree';
import { diffSnapshots } from '../helpers/diffSnapshots';
import { RootSnapshot, SnapshotDiff } from '../helpers/types';
import { walkTree } from '../helpers/walkTree';

/**
 * Immutable state container for a tree and its node statuses.
 * Inspired by CodeMirror's EditorState - all updates return new instances.
 */
export class TreeState {
  readonly tree: RootNode;
  readonly nodeStates: ReadonlyMap<string, NodeStatus>;
  readonly snapshot: RootSnapshot;
  private _diffs: SnapshotDiff[] | null = null;
  private _previousSnapshot: RootSnapshot | null = null;

  private constructor(
    tree: RootNode,
    nodeStates: Map<string, NodeStatus>,
    snapshot: RootSnapshot,
    previousSnapshot: RootSnapshot | null = null
  ) {
    this.tree = tree;
    this.nodeStates = nodeStates;
    this.snapshot = snapshot;
    this._previousSnapshot = previousSnapshot;
  }

  /**
   * Creates a new TreeState from a tree.
   * All nodes start in PENDING state.
   */
  static create(tree: RootNode): TreeState {
    return TreeState.build(tree, new Map());
  }

  /**
   * Returns the status of the entire tree (root status).
   */
  get status(): NodeStatus {
    return this.snapshot.status;
  }

  /**
   * Returns diffs from the previous snapshot (lazy computed).
   */
  get diffs(): SnapshotDiff[] {
    if (this._diffs === null && this._previousSnapshot) {
      this._diffs = diffSnapshots(this._previousSnapshot, this.snapshot);
    }
    return this._diffs ?? [];
  }

  /**
   * Marks a node as fulfilled (PASSED).
   * Returns a new TreeState.
   */
  fulfill(nodeId: string): TreeState {
    return this.setNodeStatus(nodeId, 'PASSED');
  }

  /**
   * Marks a node as rejected (FAILED).
   * Returns a new TreeState.
   */
  reject(nodeId: string): TreeState {
    return this.setNodeStatus(nodeId, 'FAILED');
  }

  /**
   * Resets a node to PENDING.
   * Returns a new TreeState.
   */
  reset(nodeId: string): TreeState {
    return this.setNodeStatus(nodeId, 'PENDING');
  }

  /**
   * Sets a node's status to any value.
   * Returns a new TreeState.
   */
  setNodeStatus(nodeId: string, status: NodeStatus): TreeState {
    const current = this.nodeStates.get(nodeId);
    if (current === status) {
      return this;
    }

    const newStates = new Map(this.nodeStates);
    newStates.set(nodeId, status);
    const newSnapshot = evaluateTree(this.tree, newStates);
    return new TreeState(this.tree, newStates, newSnapshot, this.snapshot);
  }

  /**
   * Batch update multiple nodes at once.
   * More efficient than multiple individual updates.
   */
  update(updates: Record<string, NodeStatus>): TreeState {
    if (Object.keys(updates).length === 0) {
      return this;
    }

    let changed = false;
    const newStates = new Map(this.nodeStates);
    for (const [nodeId, status] of Object.entries(updates)) {
      const current = newStates.get(nodeId);
      if (current === status) {
        continue;
      }
      changed = true;
      newStates.set(nodeId, status);
    }

    if (!changed) {
      return this;
    }

    const newSnapshot = evaluateTree(this.tree, newStates);
    return new TreeState(this.tree, newStates, newSnapshot, this.snapshot);
  }

  /**
   * Gets the status of a specific node.
   */
  getNodeStatus(nodeId: string): NodeStatus | undefined {
    return this.nodeStates.get(nodeId);
  }

  /**
   * Checks if the entire tree is fulfilled.
   */
  isFulfilled(): boolean {
    return this.status === 'PASSED';
  }

  /**
   * Checks if the entire tree is rejected.
   */
  isRejected(): boolean {
    return this.status === 'FAILED';
  }

  /**
   * Checks if the tree is still pending.
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Creates a snapshot that can be restored later.
   */
  toSnapshot(): TreeStateSnapshot {
    return {
      tree: this.tree,
      nodeStates: new Map(this.nodeStates),
      snapshot: this.snapshot,
    };
  }

  /**
   * Restores from a snapshot.
   */
  static fromSnapshot(snapshot: TreeStateSnapshot): TreeState {
    return new TreeState(
      snapshot.tree,
      new Map(snapshot.nodeStates),
      snapshot.snapshot
    );
  }

  /**
   * Rebind this state to a different tree instance, preserving node statuses where possible.
   * Nodes missing in the destination tree default to PENDING.
   */
  rebind(tree: RootNode): TreeState {
    if (tree === this.tree) {
      return this;
    }

    return TreeState.build(tree, new Map(this.nodeStates));
  }

  private static build(
    tree: RootNode,
    existingStates: Map<string, NodeStatus>
  ): TreeState {
    tree.rebuildIndexes();

    const nodeStates = new Map<string, NodeStatus>();
    walkTree(tree, node => {
      if (node instanceof ExpectationNode) {
        const status = existingStates.get(node.id) ?? 'PENDING';
        nodeStates.set(node.id, status);
      }
    });

    const snapshot = evaluateTree(tree, nodeStates);
    return new TreeState(tree, nodeStates, snapshot);
  }
}

/**
 * Serializable snapshot of TreeState for time-travel/undo.
 */
export interface TreeStateSnapshot {
  tree: RootNode;
  nodeStates: Map<string, NodeStatus>;
  snapshot: RootSnapshot;
}
