import { createExpectationNode } from './shared';
export { FluentBuilder } from './fluent';
export { defineExpectation, expectation } from './factories';
export { NodeExpr, defineNamespace } from './expr';
export function createExpectation(spec, options) {
    return createExpectationNode(spec, options);
}
/**
 * Create a node with optional metadata for tagging/aliasing.
 *
 * @example
 * const node = check(
 *   { type: "user", role: "admin" },
 *   { metadata: { alias: "user.isAdmin", tags: ["auth"], group: "user" } }
 * );
 */
export function check(spec, options) {
    return createExpectation(spec, options);
}
/**
 * Fluent helper to create a node with alias (dot syntax support).
 *
 * @example
 * const node = node("user.isAdmin", { type: "user", role: "admin" });
 */
export function node(alias, spec, options) {
    return createExpectation(spec, {
        ...options,
        alias,
    });
}
