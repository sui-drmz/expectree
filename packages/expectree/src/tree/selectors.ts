import { ExpectationNode, RootNode } from './nodes';
import { walkTree } from '../helpers/walkTree';

/**
 * Selector for finding nodes in a tree.
 */
export type NodeSelector =
  | string // node ID or alias
  | { id: string }
  | { alias: string }
  | { tag: string }
  | { group: string }
  | { tags: string[] } // match any of these tags
  | ((node: ExpectationNode) => boolean); // custom predicate

/**
 * Find nodes in a tree matching a selector.
 */
export function findNodes(
  root: RootNode,
  selector: NodeSelector
): ExpectationNode[] {
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

  const results: ExpectationNode[] = [];

  walkTree(root, node => {
    if (!(node instanceof ExpectationNode)) return;

    if (matchesSelector(node, selector)) {
      results.push(node);
    }
  });

  return results;
}

/**
 * Find a single node (returns first match).
 */
export function findNode(
  root: RootNode,
  selector: NodeSelector
): ExpectationNode | undefined {
  return findNodes(root, selector)[0];
}

/**
 * Check if a node matches a selector.
 */
export function matchesSelector(
  node: ExpectationNode,
  selector: NodeSelector
): boolean {
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
export function parseSelector(selector: string): NodeSelector {
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
export function find(root: RootNode, selector: string): ExpectationNode[] {
  return findNodes(root, parseSelector(selector));
}

/**
 * Helper to find a single node with string selector syntax.
 */
export function findOne(
  root: RootNode,
  selector: string
): ExpectationNode | undefined {
  return findNode(root, parseSelector(selector));
}
