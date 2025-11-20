import { ExpectationNode } from './nodes';
import { walkTree } from '../helpers/walkTree';
/**
 * Find nodes in a tree matching a selector.
 */
export function findNodes(root, selector) {
    if (typeof selector === 'string') {
        const parsed = parseSelector(selector);
        if (typeof parsed === 'string') {
            const idMatch = root.getNodeById(parsed);
            if (idMatch) {
                return [idMatch];
            }
            const aliasMatch = root.getNodeByAlias(parsed);
            if (aliasMatch) {
                return [aliasMatch];
            }
            return [];
        }
        selector = parsed;
    }
    if (typeof selector === 'object') {
        if ('id' in selector) {
            const node = root.getNodeById(selector.id);
            return node ? [node] : [];
        }
        if ('alias' in selector) {
            const node = root.getNodeByAlias(selector.alias);
            return node ? [node] : [];
        }
    }
    const results = [];
    walkTree(root, node => {
        if (!(node instanceof ExpectationNode))
            return;
        if (matchesSelector(node, selector)) {
            results.push(node);
        }
    });
    return results;
}
/**
 * Find a single node (returns first match).
 */
export function findNode(root, selector) {
    return findNodes(root, selector)[0];
}
/**
 * Check if a node matches a selector.
 */
export function matchesSelector(node, selector) {
    // String selector: match ID or alias
    if (typeof selector === 'string') {
        return node.id === selector || node.alias === selector;
    }
    // Function selector: custom predicate
    if (typeof selector === 'function') {
        return selector(node);
    }
    // Object selectors
    if ('id' in selector) {
        return node.id === selector.id;
    }
    if ('alias' in selector) {
        return node.alias === selector.alias;
    }
    if ('tag' in selector) {
        return node.tags?.includes(selector.tag) ?? false;
    }
    if ('tags' in selector) {
        return selector.tags.some(tag => node.tags?.includes(tag)) ?? false;
    }
    if ('group' in selector) {
        return node.group === selector.group;
    }
    return false;
}
/**
 * Parse a string selector with special syntax:
 * - "nodeId" - match by ID
 * - "#tag" - match by tag
 * - "@group" - match by group
 * - "alias.name" - match by alias (dot syntax)
 */
export function parseSelector(selector) {
    if (selector.startsWith('#')) {
        return { tag: selector.slice(1) };
    }
    if (selector.startsWith('@')) {
        return { group: selector.slice(1) };
    }
    // Default: match by ID or alias
    return selector;
}
/**
 * Helper to find nodes with string selector syntax.
 */
export function find(root, selector) {
    return findNodes(root, parseSelector(selector));
}
/**
 * Helper to find a single node with string selector syntax.
 */
export function findOne(root, selector) {
    return findNode(root, parseSelector(selector));
}
