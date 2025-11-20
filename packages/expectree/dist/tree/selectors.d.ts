import { ExpectationNode, RootNode } from './nodes';
/**
 * Selector for finding nodes in a tree.
 */
export type NodeSelector = string | {
    id: string;
} | {
    alias: string;
} | {
    tag: string;
} | {
    group: string;
} | {
    tags: string[];
} | ((node: ExpectationNode) => boolean);
/**
 * Find nodes in a tree matching a selector.
 */
export declare function findNodes(root: RootNode, selector: NodeSelector): ExpectationNode[];
/**
 * Find a single node (returns first match).
 */
export declare function findNode(root: RootNode, selector: NodeSelector): ExpectationNode | undefined;
/**
 * Check if a node matches a selector.
 */
export declare function matchesSelector(node: ExpectationNode, selector: NodeSelector): boolean;
/**
 * Parse a string selector with special syntax:
 * - "nodeId" - match by ID
 * - "#tag" - match by tag
 * - "@group" - match by group
 * - "alias.name" - match by alias (dot syntax)
 */
export declare function parseSelector(selector: string): NodeSelector;
/**
 * Helper to find nodes with string selector syntax.
 */
export declare function find(root: RootNode, selector: string): ExpectationNode[];
/**
 * Helper to find a single node with string selector syntax.
 */
export declare function findOne(root: RootNode, selector: string): ExpectationNode | undefined;
