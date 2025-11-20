import { evaluateTree } from '../helpers/evaluateTree';
import { diffSnapshots } from '../helpers/diffSnapshots';
import { walkTree } from '../helpers/walkTree';
import { ExpectationNode } from '../tree/nodes';
/**
 * Reducer function for the ExpectationRuntime state.
 *
 * This function takes the current state and an action,
 * and returns the new state.
 *
 * @param state - The current state of the ExpectationRuntime.
 * @param action - The action to be applied to the state.
 * @returns The new state of the ExpectationRuntime.
 */
export function reducer(state, action) {
    switch (action.type) {
        case 'SET_TREE': {
            const defaultMap = createDefaultStatusMap(action.tree);
            return applyUpdate(state, { tree: action.tree, statusMap: defaultMap });
        }
        case 'UPDATE_STATUS_MAP': {
            return applyUpdate(state, { statusMap: action.statusMap });
        }
        case 'UPDATE_NODE_STATUS': {
            const newMap = new Map(state.statusMap);
            newMap.set(action.id, action.status);
            return applyUpdate(state, { statusMap: newMap });
        }
        default:
            return state;
    }
}
/**
 * Creates a default status map for a tree.
 *
 * This function walks the tree and sets the status of each expectation node
 * to "PENDING".
 *
 * @param tree - The tree to create the status map for.
 * @returns A map of expectation IDs to their statuses.
 */
function createDefaultStatusMap(tree) {
    const statusMap = new Map();
    walkTree(tree, node => {
        if (node instanceof ExpectationNode) {
            statusMap.set(node.id, 'PENDING');
        }
    });
    return statusMap;
}
// Introduce a single helper to DRY up evaluate→diff→merge
function applyUpdate(state, updates) {
    const nextTree = updates.tree ?? state.tree;
    const nextStatusMap = updates.statusMap ?? state.statusMap;
    const snapshot = evaluateTree(nextTree, nextStatusMap);
    const diffs = diffSnapshots(state.snapshot, snapshot);
    return {
        ...state,
        tree: nextTree,
        statusMap: nextStatusMap,
        snapshot,
        diffs,
    };
}
