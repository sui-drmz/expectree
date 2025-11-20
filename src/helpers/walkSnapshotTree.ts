import { EvaluationSnapshot, snapshotIsUnary, snapshotIsBinary } from './types';

/**
 * Defines a callback function for tree traversal operations.
 * Implementations should not modify the tree structure to avoid traversal issues.
 *
 * @param node - Current node being visited
 * @param path - Hierarchical path from root to current node (includes all ancestors)
 */
type Visitor = (node: EvaluationSnapshot, path: EvaluationSnapshot[]) => void;

/**
 * Executes a depth-first, pre-order traversal of the evaluation snapshot tree.
 * Visits nodes in the order: current node → left child → right child (where applicable).
 *
 * @param snapShot - Starting point for the traversal
 * @param visitor - Callback to execute on each node
 * @param currentPath - Internal tracking for node ancestry (defaults to empty array)
 */
export function walkSnapshotTree(
  snapShot: EvaluationSnapshot,
  visitor: Visitor,
  currentPath: EvaluationSnapshot[] = []
): void {
  // Process current node before its children (pre-order traversal)
  visitor(snapShot, currentPath);

  // Recursively traverse child nodes based on node type
  if (snapshotIsBinary(snapShot)) {
    walkSnapshotTree(snapShot.left, visitor, [...currentPath, snapShot]);
    walkSnapshotTree(snapShot.right, visitor, [...currentPath, snapShot]);
  } else if (snapshotIsUnary(snapShot)) {
    walkSnapshotTree(snapShot.child, visitor, [...currentPath, snapShot]);
  } else if (snapShot.type === 'ROOT' && snapShot.child) {
    walkSnapshotTree(snapShot.child, visitor, [...currentPath, snapShot]);
  }
}
