import { RootNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
import { RootSnapshot, SnapshotDiff } from '../helpers/types';
/**
 * Immutable state container for a tree and its node statuses.
 * Inspired by CodeMirror's EditorState - all updates return new instances.
 */
export declare class TreeState {
    readonly tree: RootNode;
    readonly nodeStates: ReadonlyMap<string, NodeStatus>;
    readonly snapshot: RootSnapshot;
    private _diffs;
    private _previousSnapshot;
    private constructor();
    /**
     * Creates a new TreeState from a tree.
     * All nodes start in PENDING state.
     */
    static create(tree: RootNode): TreeState;
    /**
     * Returns the status of the entire tree (root status).
     */
    get status(): NodeStatus;
    /**
     * Returns diffs from the previous snapshot (lazy computed).
     */
    get diffs(): SnapshotDiff[];
    /**
     * Marks a node as fulfilled (PASSED).
     * Returns a new TreeState.
     */
    fulfill(nodeId: string): TreeState;
    /**
     * Marks a node as rejected (FAILED).
     * Returns a new TreeState.
     */
    reject(nodeId: string): TreeState;
    /**
     * Resets a node to PENDING.
     * Returns a new TreeState.
     */
    reset(nodeId: string): TreeState;
    /**
     * Sets a node's status to any value.
     * Returns a new TreeState.
     */
    setNodeStatus(nodeId: string, status: NodeStatus): TreeState;
    /**
     * Batch update multiple nodes at once.
     * More efficient than multiple individual updates.
     */
    update(updates: Record<string, NodeStatus>): TreeState;
    /**
     * Gets the status of a specific node.
     */
    getNodeStatus(nodeId: string): NodeStatus | undefined;
    /**
     * Checks if the entire tree is fulfilled.
     */
    isFulfilled(): boolean;
    /**
     * Checks if the entire tree is rejected.
     */
    isRejected(): boolean;
    /**
     * Checks if the tree is still pending.
     */
    isPending(): boolean;
    /**
     * Creates a snapshot that can be restored later.
     */
    toSnapshot(): TreeStateSnapshot;
    /**
     * Restores from a snapshot.
     */
    static fromSnapshot(snapshot: TreeStateSnapshot): TreeState;
    /**
     * Rebind this state to a different tree instance, preserving node statuses where possible.
     * Nodes missing in the destination tree default to PENDING.
     */
    rebind(tree: RootNode): TreeState;
    private static build;
}
/**
 * Serializable snapshot of TreeState for time-travel/undo.
 */
export interface TreeStateSnapshot {
    tree: RootNode;
    nodeStates: Map<string, NodeStatus>;
    snapshot: RootSnapshot;
}
