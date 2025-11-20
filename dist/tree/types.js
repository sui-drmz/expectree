import { AndNode, GroupNode, NotNode, OrNode } from './nodes';
/**
 * Type guards for node types
 */
export const isBinaryNode = (node) => node instanceof AndNode || node instanceof OrNode;
export const isUnaryNode = (node) => node instanceof NotNode || node instanceof GroupNode;
