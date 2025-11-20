import { AndNode, GroupNode, NotNode, OrNode, Node } from './nodes';
export declare const and: (left: Node, right: Node) => AndNode;
export declare const or: (left: Node, right: Node) => OrNode;
export declare const not: (child: Node) => NotNode;
export declare const group: (child: Node, alias?: string) => GroupNode;
