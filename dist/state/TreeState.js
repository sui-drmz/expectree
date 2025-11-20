import { ExpectationNode } from '../tree/nodes';
import { evaluateTree } from '../helpers/evaluateTree';
import { diffSnapshots } from '../helpers/diffSnapshots';
import { walkTree } from '../helpers/walkTree';
/**
 * Immutable state container for a tree and its node statuses.
 * Inspired by CodeMirror's EditorState - all updates return new instances.
 */
export class TreeState {
    tree;
    nodeStates;
    snapshot;
    _diffs = null;
    _previousSnapshot = null;
    constructor(tree, nodeStates, snapshot, previousSnapshot = null) {
        this.tree = tree;
        this.nodeStates = nodeStates;
        this.snapshot = snapshot;
        this._previousSnapshot = previousSnapshot;
    }
    /**
     * Creates a new TreeState from a tree.
     * All nodes start in PENDING state.
     */
    static create(tree) {
        return TreeState.build(tree, new Map());
    }
    /**
     * Returns the status of the entire tree (root status).
     */
    get status() {
        return this.snapshot.status;
    }
    /**
     * Returns diffs from the previous snapshot (lazy computed).
     */
    get diffs() {
        if (this._diffs === null && this._previousSnapshot) {
            this._diffs = diffSnapshots(this._previousSnapshot, this.snapshot);
        }
        return this._diffs ?? [];
    }
    /**
     * Marks a node as fulfilled (PASSED).
     * Returns a new TreeState.
     */
    fulfill(nodeId) {
        return this.setNodeStatus(nodeId, 'PASSED');
    }
    /**
     * Marks a node as rejected (FAILED).
     * Returns a new TreeState.
     */
    reject(nodeId) {
        return this.setNodeStatus(nodeId, 'FAILED');
    }
    /**
     * Resets a node to PENDING.
     * Returns a new TreeState.
     */
    reset(nodeId) {
        return this.setNodeStatus(nodeId, 'PENDING');
    }
    /**
     * Sets a node's status to any value.
     * Returns a new TreeState.
     */
    setNodeStatus(nodeId, status) {
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
    update(updates) {
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
    getNodeStatus(nodeId) {
        return this.nodeStates.get(nodeId);
    }
    /**
     * Checks if the entire tree is fulfilled.
     */
    isFulfilled() {
        return this.status === 'PASSED';
    }
    /**
     * Checks if the entire tree is rejected.
     */
    isRejected() {
        return this.status === 'FAILED';
    }
    /**
     * Checks if the tree is still pending.
     */
    isPending() {
        return this.status === 'PENDING';
    }
    /**
     * Creates a snapshot that can be restored later.
     */
    toSnapshot() {
        return {
            tree: this.tree,
            nodeStates: new Map(this.nodeStates),
            snapshot: this.snapshot,
        };
    }
    /**
     * Restores from a snapshot.
     */
    static fromSnapshot(snapshot) {
        return new TreeState(snapshot.tree, new Map(snapshot.nodeStates), snapshot.snapshot);
    }
    /**
     * Rebind this state to a different tree instance, preserving node statuses where possible.
     * Nodes missing in the destination tree default to PENDING.
     */
    rebind(tree) {
        if (tree === this.tree) {
            return this;
        }
        return TreeState.build(tree, new Map(this.nodeStates));
    }
    static build(tree, existingStates) {
        tree.rebuildIndexes();
        const nodeStates = new Map();
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
