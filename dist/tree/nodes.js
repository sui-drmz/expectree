import { TreeState } from '../state/TreeState';
import { DuplicateAliasError, DuplicateNodeIdError } from './exceptions';
export class Node {
    /**
     * Internal state reference for sugar-coated API.
     * Managed by the tree root.
     */
    _treeState = null;
    _rootNode = null;
    /**
     * Internal: attach tree state for stateful API.
     */
    _attachState(state, root) {
        this._treeState = state;
        this._rootNode = root;
    }
    /**
     * Get the current tree state.
     */
    get _state() {
        if (!this._treeState) {
            throw new Error('Node not attached to a tree state. Use TreeState.create() or node.asTree()');
        }
        return this._treeState;
    }
    /**
     * Update the tree state (propagates to root).
     */
    _setState(newState) {
        if (!this._rootNode) {
            throw new Error('Node not attached to a tree');
        }
        this._rootNode._updateState(newState);
    }
}
export class RootNode extends Node {
    type = 'ROOT';
    child;
    _listeners = new Set();
    _aliasIndex = new Map();
    _aliasBuckets = new Map();
    _idIndex = new Map();
    _indexesDirty = true;
    constructor(child) {
        super();
        this.child = child;
        this._markIndexesDirty();
    }
    isEmpty() {
        return this.child === undefined;
    }
    get children() {
        return this.child ? [this.child] : [];
    }
    rebuildIndexes() {
        const aliasIndex = new Map();
        const aliasBuckets = new Map();
        const idIndex = new Map();
        const aliasStack = [];
        const traverse = (node) => {
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
    getNodeById(id) {
        this._ensureIndexes();
        return this._idIndex.get(id);
    }
    getNodeByAlias(alias) {
        this._ensureIndexes();
        return this._aliasIndex.get(alias);
    }
    getAliasesFor(node) {
        this._ensureIndexes();
        return Array.from(this._aliasBuckets.get(node) ?? new Set());
    }
    _ensureIndexes() {
        if (this._indexesDirty) {
            this.rebuildIndexes();
        }
    }
    _markIndexesDirty() {
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
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }
    /**
     * Internal: update state and propagate to all nodes.
     */
    _updateState(newState) {
        const oldState = this['_treeState']; // Access via bracket notation to avoid TS error
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
    _notify(event) {
        for (const listener of this._listeners) {
            listener(event);
        }
    }
    /**
     * Propagate state to all child nodes recursively.
     */
    _propagateState(state) {
        const visit = (node) => {
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
    initializeState(state) {
        const nextState = state ? state.rebind(this) : TreeState.create(this);
        this._updateState(nextState);
        return this;
    }
    hasState() {
        return Boolean(this._treeState);
    }
    get treeState() {
        const state = this
            ._treeState;
        if (!state) {
            throw new Error('Tree does not have state attached. Call initializeState() first.');
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
    isFulfilled() {
        return this._state.isFulfilled();
    }
    /**
     * Check if tree is rejected.
     */
    isRejected() {
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
    type = 'GROUP';
    child;
    alias;
    constructor(child, alias) {
        super();
        this.child = child;
        this.alias = alias;
    }
    get children() {
        return [this.child];
    }
}
export class ExpectationNode extends Node {
    id;
    type = 'EXPECTATION';
    /**
     * The specification of what this expectation node is expecting.
     * Contains all the details about what should be evaluated.
     */
    spec;
    /**
     * Optional metadata for tagging, grouping, and aliasing.
     */
    alias;
    tags;
    group;
    constructor(id, spec, metadata) {
        super();
        this.id = id;
        this.spec = spec;
        this.alias = metadata?.alias;
        this.tags = metadata?.tags;
        this.group = metadata?.group;
    }
    get children() {
        return [];
    }
    /**
     * Mark this node as fulfilled (PASSED).
     * Sweet, joyful API! 🎉
     */
    fulfill() {
        const newState = this._state.fulfill(this.id);
        this._setState(newState);
    }
    /**
     * Mark this node as rejected (FAILED).
     */
    reject() {
        const newState = this._state.reject(this.id);
        this._setState(newState);
    }
    /**
     * Reset this node to PENDING.
     */
    reset() {
        const newState = this._state.reset(this.id);
        this._setState(newState);
    }
    /**
     * Fulfill this node asynchronously.
     * Useful for async validation, API calls, etc.
     */
    async fulfillAsync(fn) {
        try {
            await fn();
            this.fulfill();
        }
        catch (error) {
            this.reject();
            throw error;
        }
    }
    /**
     * Reject this node asynchronously.
     * Useful for async validation that should fail.
     */
    async rejectAsync(fn) {
        try {
            await fn();
            this.reject();
        }
        catch (error) {
            this.reject();
            throw error;
        }
    }
    /**
     * Evaluate an async condition and fulfill/reject based on result.
     */
    async evaluateAsync(fn) {
        try {
            const result = await fn();
            if (result) {
                this.fulfill();
            }
            else {
                this.reject();
            }
        }
        catch (error) {
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
    isFulfilled() {
        return this.status === 'PASSED';
    }
    /**
     * Check if this node is rejected.
     */
    isRejected() {
        return this.status === 'FAILED';
    }
    /**
     * Check if this node is pending.
     */
    isPending() {
        return this.status === 'PENDING';
    }
}
export class AndNode extends Node {
    type = 'AND';
    left;
    right;
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    get children() {
        return [this.left, this.right];
    }
}
export class OrNode extends Node {
    type = 'OR';
    left;
    right;
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    get children() {
        return [this.left, this.right];
    }
}
export class NotNode extends Node {
    type = 'NOT';
    child;
    constructor(child) {
        super();
        this.child = child;
    }
    get children() {
        return [this.child];
    }
}
function pushAliasSegments(stack, alias) {
    const segments = alias
        .split('.')
        .map(segment => segment.trim())
        .filter(Boolean);
    stack.push(...segments);
    return segments.length;
}
function collectAliasKeys(node, aliasStack) {
    const keys = new Set();
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
