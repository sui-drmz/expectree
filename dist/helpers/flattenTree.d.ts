import { ExpectationNode, RootNode } from '../tree/nodes';
/**
 * Flattens an expectation tree into a Map of ID → ExpectationNode
 * Only ExpectationNodes (leaf nodes) are included.
 *
 * @param root the root node of the tree
 * @returns a map of ID → ExpectationNode
 */
export declare function flattenTree(root: RootNode): Map<string, ExpectationNode>;
