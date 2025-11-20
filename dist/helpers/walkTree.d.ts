import { Node } from '../tree/nodes';
/**
 * A visitor function that will be called for each node during tree traversal.
 *
 * @param node The current node being visited
 * @param path An array representing the path from the root to the current node
 */
type Visitor = (node: Node, path: Node[]) => void;
/**
 * Walks through a tree of logical operator nodes, applying a visitor function to each node.
 * This implements a depth-first traversal of the tree structure.
 *
 * @param node The current node to process
 * @param visit The visitor function to apply to each node
 * @param path The current path from root to the current node (used for tracking ancestry)
 */
export declare function walkTree(node: Node, visit: Visitor, path?: Node[]): void;
export {};
