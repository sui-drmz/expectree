import { walkTree } from './walkTree';
import { ExpectationNode } from '../tree/nodes';
/**
 * Flattens an expectation tree into a Map of ID → ExpectationNode
 * Only ExpectationNodes (leaf nodes) are included.
 *
 * @param root the root node of the tree
 * @returns a map of ID → ExpectationNode
 */
export function flattenTree(root) {
    const map = new Map();
    walkTree(root, node => {
        if (node instanceof ExpectationNode) {
            const id = node.id;
            if (!id) {
                throw new Error('ExpectationNode missing id');
            }
            map.set(id, node);
        }
    });
    return map;
}
