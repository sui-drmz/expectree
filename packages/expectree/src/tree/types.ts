import { AndNode, GroupNode, Node, NotNode, OrNode } from './nodes';

export type LogicalOperator = 'AND' | 'OR';

export type NodeStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'SKIPPED'
  | 'REMOVED';

export type NodeType = 'ROOT' | 'AND' | 'OR' | 'NOT' | 'GROUP' | 'EXPECTATION';

/**
 * Basic expectation specification type
 * This is a simplified version for the new API
 */
export type ExpectationSpec = {
  type: string;
  [key: string]: unknown;
};

/**
 * Type guards for node types
 */
export const isBinaryNode = (node: Node): node is AndNode | OrNode =>
  node instanceof AndNode || node instanceof OrNode;

export const isUnaryNode = (node: Node): node is NotNode | GroupNode =>
  node instanceof NotNode || node instanceof GroupNode;
