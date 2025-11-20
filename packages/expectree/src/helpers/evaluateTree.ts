import {
  RootNode,
  Node,
  AndNode,
  OrNode,
  NotNode,
  GroupNode,
  ExpectationNode,
} from '../tree/nodes';
import { NodeStatus, isBinaryNode, isUnaryNode } from '../tree/types';
import { EvaluationMap, EvaluationSnapshot, RootSnapshot } from './types';

type Evaluator = (node: Node) => EvaluationSnapshot;

/**
 * Evaluates the entire tree and returns the root node's status.
 *
 * @param root - The root node of the tree.
 * @param statusMap - The status map of the tree.
 * @returns The root node's snapshot.
 */
export function evaluateTree(
  root: RootNode,
  statusMap: EvaluationMap
): RootSnapshot {
  return evaluateRoot(root, statusMap);
}

/**
 * Creates an evaluator function for a given node type.
 *
 * @param statusMap - The status map of the tree.
 * @returns An evaluator function for the given node type.
 */
const createEvaluator = (statusMap: EvaluationMap): Evaluator => {
  return (node: Node) => {
    switch (node.type) {
      case 'AND':
        return evaluateAnd(node as AndNode, statusMap);
      case 'OR':
        return evaluateOr(node as OrNode, statusMap);
      case 'NOT':
        return evaluateNot(node as NotNode, statusMap);
      case 'GROUP':
        return evaluateGroup(node as GroupNode, statusMap);
      case 'EXPECTATION':
        return evaluateExpectation(node as ExpectationNode, statusMap);
      case 'ROOT':
        return evaluateRoot(node as RootNode, statusMap);
      default:
        throw new Error(`Unknown node type: ${(node as Node).type}`);
    }
  };
};

/**
 * Evaluates the root node of the tree.
 *
 * @param root - The root node of the tree.
 * @param statusMap - The status map of the tree.
 * @returns The root node's snapshot.
 */
const evaluateRoot = (
  root: RootNode,
  statusMap: EvaluationMap
): RootSnapshot => {
  if (!root.child) return { type: 'ROOT', status: 'PENDING' };

  const evaluate = createEvaluator(statusMap);
  const childResult = evaluate(root.child);

  return {
    type: 'ROOT',
    status: childResult.status,
    child: childResult,
  };
};

/**
 * Evaluates an AND node.
 *
 * @param node - The AND node to evaluate.
 * @param statusMap - The status map of the tree.
 * @returns The AND node's snapshot.
 */
const evaluateAnd = (
  node: AndNode,
  statusMap: EvaluationMap
): EvaluationSnapshot => {
  const evaluate = createEvaluator(statusMap);
  const left = evaluate(node.left);

  // Short-circuit on left failure
  if (left.status === 'FAILED') {
    return {
      type: 'AND',
      status: 'FAILED',
      left,
      right: skipNode(node.right, statusMap),
    };
  }

  const right = evaluate(node.right);
  return {
    type: 'AND',
    status: combineAndStatus(left.status, right.status),
    left,
    right,
  };
};

/**
 * Evaluates an OR node.
 *
 * @param node - The OR node to evaluate.
 * @param statusMap - The status map of the tree.
 * @returns The OR node's snapshot.
 */
const evaluateOr = (
  node: OrNode,
  statusMap: EvaluationMap
): EvaluationSnapshot => {
  const evaluate = createEvaluator(statusMap);
  const left = evaluate(node.left);

  // Short-circuit on left success
  if (left.status === 'PASSED') {
    return {
      type: 'OR',
      status: 'PASSED',
      left,
      right: skipNode(node.right, statusMap),
    };
  }

  const right = evaluate(node.right);
  return {
    type: 'OR',
    status: combineOrStatus(left.status, right.status),
    left,
    right,
  };
};

/**
 * Evaluates a NOT node.
 *
 * @param node - The NOT node to evaluate.
 * @param statusMap - The status map of the tree.
 * @returns The NOT node's snapshot.
 */
const evaluateNot = (
  node: NotNode,
  statusMap: EvaluationMap
): EvaluationSnapshot => {
  const evaluate = createEvaluator(statusMap);
  const child = evaluate(node.child);

  return {
    type: 'NOT',
    status: negateStatus(child.status),
    child,
  };
};

/**
 * Evaluates a GROUP node.
 *
 * @param node the group node to evaluate
 * @param statusMap the status map of the tree
 * @returns the group node's snapshot.
 */
const evaluateGroup = (
  node: GroupNode,
  statusMap: EvaluationMap
): EvaluationSnapshot => {
  const evaluate = createEvaluator(statusMap);
  const child = evaluate(node.child);

  return {
    type: 'GROUP',
    status: child.status,
    child,
  };
};

/**
 * Evaluates an expectation node.
 *
 * @param node the expectation node to evaluate
 * @param statusMap the status map of the tree
 * @returns the expectation node's snapshot.
 */
const evaluateExpectation = (
  node: ExpectationNode,
  statusMap: EvaluationMap
): EvaluationSnapshot => {
  const status = statusMap.get(node.id);
  if (!status) throw new Error(`Status missing for expectation ${node.id}`);

  return {
    type: 'EXPECTATION',
    id: node.id,
    status,
  };
};

/**
 * Skip a node, with its entire subtree, recursively.
 *
 * @param node the node to skip
 * @param statusMap the status map of the tree
 * @returns the skipped node's snapshot.
 */
const skipNode = (node: Node, statusMap: EvaluationMap): EvaluationSnapshot => {
  if (node instanceof ExpectationNode) {
    return { type: 'EXPECTATION', id: node.id, status: 'SKIPPED' };
  }

  if (isBinaryNode(node)) {
    return {
      type: node.type,
      status: 'SKIPPED',
      left: skipNode(node.left, statusMap),
      right: skipNode(node.right, statusMap),
    };
  }

  if (isUnaryNode(node)) {
    return {
      type: node.type,
      status: 'SKIPPED',
      child: skipNode(node.child, statusMap),
    };
  }

  return { type: 'ROOT', status: 'SKIPPED' };
};

/**
 * Negates definitive statuses (PASSED ↔ FAILED)
 * Other statuses remain unchanged
 *
 * @param status the status to negate
 */
const negateStatus = (status: NodeStatus): NodeStatus => {
  if (status === 'PASSED') return 'FAILED';
  if (status === 'FAILED') return 'PASSED';
  return status;
};

/**
 * AND combination rules:
 * - Right failure fails immediately
 * - Both passed → passed
 * - Otherwise pending
 *
 * @param left the left node's status
 * @param right the right node's status
 * @returns the combined status
 */
const combineAndStatus = (left: NodeStatus, right: NodeStatus): NodeStatus => {
  if (right === 'FAILED') return 'FAILED';
  if (left === 'PASSED' && right === 'PASSED') return 'PASSED';
  return 'PENDING';
};

/**
 * OR combination rules:
 * - Right success passes immediately
 * - Both failed → failed
 * - Otherwise pending
 *
 * @param left the left node's status
 * @param right the right node's status
 * @returns the combined status
 */
const combineOrStatus = (left: NodeStatus, right: NodeStatus): NodeStatus => {
  if (right === 'PASSED') return 'PASSED';
  if (left === 'FAILED' && right === 'FAILED') return 'FAILED';
  return 'PENDING';
};
