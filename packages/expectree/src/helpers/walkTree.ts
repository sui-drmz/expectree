import {
  AndNode,
  GroupNode,
  NotNode,
  OrNode,
  RootNode,
  Node,
} from '../tree/nodes';

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
export function walkTree(node: Node, visit: Visitor, path: Node[] = []): void {
  visit(node, path);

  if (node instanceof AndNode || node instanceof OrNode) {
    walkTree(node.left, visit, [...path, node]);
    walkTree(node.right, visit, [...path, node]);
  } else if (node instanceof NotNode || node instanceof GroupNode) {
    walkTree(node.child, visit, [...path, node]);
  } else if (node instanceof RootNode && node.child) {
    walkTree(node.child, visit, [...path, node]);
  }
}
