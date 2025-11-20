/**
 * Query methods for RootNode to avoid circular dependencies.
 * These are added as methods via the index export.
 */
import { RootNode, ExpectationNode } from './nodes';
import {
  findNodes,
  findNode,
  parseSelector,
  type NodeSelector,
} from './selectors';

export function find(
  this: RootNode,
  selector: string | NodeSelector
): ExpectationNode[] {
  return findNodes(this, selector);
}

export function findOne(
  this: RootNode,
  selector: string | NodeSelector
): ExpectationNode | undefined {
  return find.call(this, selector)[0];
}

export function findByTag(this: RootNode, tag: string): ExpectationNode[] {
  return findNodes(this, { tag });
}

export function findByGroup(this: RootNode, group: string): ExpectationNode[] {
  return findNodes(this, { group });
}

export function findByAlias(
  this: RootNode,
  alias: string
): ExpectationNode | undefined {
  return this.getNodeByAlias(alias);
}

// Attach methods to RootNode prototype
Object.assign(RootNode.prototype, {
  find,
  findOne,
  findByTag,
  findByGroup,
  findByAlias,
});

// Type augmentation
declare module './nodes' {
  interface RootNode {
    find(selector: string | NodeSelector): ExpectationNode[];
    findOne(selector: string | NodeSelector): ExpectationNode | undefined;
    findByTag(tag: string): ExpectationNode[];
    findByGroup(group: string): ExpectationNode[];
    findByAlias(alias: string): ExpectationNode | undefined;
  }
}
