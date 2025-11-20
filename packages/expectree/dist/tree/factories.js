import { AndNode, GroupNode, NotNode, OrNode } from './nodes';
export const and = (left, right) => new AndNode(left, right);
export const or = (left, right) => new OrNode(left, right);
export const not = (child) => new NotNode(child);
export const group = (child, alias) => new GroupNode(child, alias);
// expectation helper removed to avoid conflict with builder/expectation
// Just use the node directly or import from builder if needed
