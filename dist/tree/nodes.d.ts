import { NodeType, ExpectationSpec } from './types';
import { TreeState } from '../state/TreeState';
import { RootSnapshot, SnapshotDiff } from '../helpers/types';
export declare abstract class Node {
    abstract readonly type: NodeType;
    /**
     * Internal state reference for sugar-coated API.
     * Managed by the tree root.
     */
    private _treeState;
    private _rootNode;
    /**
     * Returns the children of the node.
     */
    abstract get children(): readonly Node[];
    /**
     * Internal: attach tree state for stateful API.
     */
    _attachState(state: TreeState, root: RootNode): void;
    /**
     * Get the current tree state.
     */
    protected get _state(): TreeState;
    /**
     * Update the tree state (propagates to root).
     */
    protected _setState(newState: TreeState): void;
}
type TreeListener = (event: TreeUpdateEvent) => void;
export interface TreeUpdateEvent {
    tree: RootNode;
    snapshot: RootSnapshot;
    previousSnapshot: RootSnapshot | null;
    diffs: SnapshotDiff[];
    state: TreeState;
}
export declare class RootNode extends Node {
    readonly type = "ROOT";
    readonly child: Node | undefined;
    private _listeners;
    private _aliasIndex;
    private _aliasBuckets;
    private _idIndex;
    private _indexesDirty;
    constructor(child?: Node);
    isEmpty(): boolean;
    get children(): readonly Node[];
    rebuildIndexes(): this;
    getNodeById(id: string): ExpectationNode | undefined;
    getNodeByAlias(alias: string): ExpectationNode | undefined;
    getAliasesFor(node: ExpectationNode): string[];
    private _ensureIndexes;
    private _markIndexesDirty;
    /**
     * Subscribe to state changes. Returns an unsubscribe function.
     * Listeners receive a {@link TreeUpdateEvent} detailing the latest snapshot,
     * diffs, and backing {@link TreeState} instance.
     */
    subscribe(listener: TreeListener): () => void;
    /**
     * Internal: update state and propagate to all nodes.
     */
    _updateState(newState: TreeState): void;
    /**
     * Notify all subscribers of state changes.
     */
    private _notify;
    /**
     * Propagate state to all child nodes recursively.
     */
    private _propagateState;
    /**
     * Initialize this tree with state management (sugar-coated API).
     * Optionally provide a precomputed {@link TreeState} (e.g. from
     * serialization).
     */
    initializeState(state?: TreeState): RootNode;
    hasState(): boolean;
    get treeState(): TreeState;
    /**
     * Get current tree status.
     */
    get status(): import("./types").NodeStatus;
    /**
     * Get current snapshot.
     */
    get snapshot(): RootSnapshot;
    /**
     * Check if tree is fulfilled.
     */
    isFulfilled(): boolean;
    /**
     * Check if tree is rejected.
     */
    isRejected(): boolean;
    /**
     * Get diffs from previous state.
     */
    get diffs(): SnapshotDiff[];
}
export declare class GroupNode extends Node {
    readonly type = "GROUP";
    readonly child: Node;
    readonly alias?: string;
    constructor(child: Node, alias?: string);
    get children(): readonly Node[];
}
export declare class ExpectationNode extends Node {
    readonly id: string;
    readonly type = "EXPECTATION";
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
    constructor(id: string, spec: ExpectationSpec, metadata?: NodeMetadata);
    get children(): readonly Node[];
    /**
     * Mark this node as fulfilled (PASSED).
     * Sweet, joyful API! 🎉
     */
    fulfill(): void;
    /**
     * Mark this node as rejected (FAILED).
     */
    reject(): void;
    /**
     * Reset this node to PENDING.
     */
    reset(): void;
    /**
     * Fulfill this node asynchronously.
     * Useful for async validation, API calls, etc.
     */
    fulfillAsync(fn: () => Promise<void>): Promise<void>;
    /**
     * Reject this node asynchronously.
     * Useful for async validation that should fail.
     */
    rejectAsync(fn: () => Promise<void>): Promise<void>;
    /**
     * Evaluate an async condition and fulfill/reject based on result.
     */
    evaluateAsync(fn: () => Promise<boolean>): Promise<void>;
    /**
     * Get the current status of this node.
     */
    get status(): import("./types").NodeStatus | undefined;
    /**
     * Check if this node is fulfilled.
     */
    isFulfilled(): boolean;
    /**
     * Check if this node is rejected.
     */
    isRejected(): boolean;
    /**
     * Check if this node is pending.
     */
    isPending(): boolean;
}
/**
 * Metadata for node tagging, grouping, and aliasing.
 */
export interface NodeMetadata {
    alias?: string;
    tags?: string[];
    group?: string;
}
export declare class AndNode extends Node {
    readonly type = "AND";
    readonly left: Node;
    readonly right: Node;
    constructor(left: Node, right: Node);
    get children(): readonly Node[];
}
export declare class OrNode extends Node {
    readonly type = "OR";
    readonly left: Node;
    readonly right: Node;
    constructor(left: Node, right: Node);
    get children(): readonly Node[];
}
export declare class NotNode extends Node {
    readonly type = "NOT";
    readonly child: Node;
    constructor(child: Node);
    get children(): readonly Node[];
}
export {};
