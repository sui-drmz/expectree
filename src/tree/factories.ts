import { AndNode, GroupNode, NotNode, OrNode, Node } from './nodes';

export const and = (left: Node, right: Node) => new AndNode(left, right);

export const or = (left: Node, right: Node) => new OrNode(left, right);

export const not = (child: Node) => new NotNode(child);

export const group = (child: Node, alias?: string) =>
  new GroupNode(child, alias);

// expectation helper removed to avoid conflict with builder/expectation
// Just use the node directly or import from builder if needed
