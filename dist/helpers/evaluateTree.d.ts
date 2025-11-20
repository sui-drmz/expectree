import { RootNode } from '../tree/nodes';
import { EvaluationMap, RootSnapshot } from './types';
/**
 * Evaluates the entire tree and returns the root node's status.
 *
 * @param root - The root node of the tree.
 * @param statusMap - The status map of the tree.
 * @returns The root node's snapshot.
 */
export declare function evaluateTree(root: RootNode, statusMap: EvaluationMap): RootSnapshot;
