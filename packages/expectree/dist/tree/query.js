/**
 * Query methods for RootNode to avoid circular dependencies.
 * These are added as methods via the index export.
 */
import { RootNode } from './nodes';
import { findNodes, } from './selectors';
export function find(selector) {
    return findNodes(this, selector);
}
export function findOne(selector) {
    return find.call(this, selector)[0];
}
export function findByTag(tag) {
    return findNodes(this, { tag });
}
export function findByGroup(group) {
    return findNodes(this, { group });
}
export function findByAlias(alias) {
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
