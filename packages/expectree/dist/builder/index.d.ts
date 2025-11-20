import { ExpectationNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { ExpectationCreationOptions } from './shared';
export { FluentBuilder } from './fluent';
export { defineExpectation, expectation } from './factories';
export { NodeExpr, defineNamespace } from './expr';
export type { ExpectationCreationOptions } from './shared';
export declare function createExpectation(spec: ExpectationSpec, options?: ExpectationCreationOptions): ExpectationNode;
export type CheckSpec = ExpectationSpec & {
    type: string;
};
/**
 * Create a node with optional metadata for tagging/aliasing.
 *
 * @example
 * const node = check(
 *   { type: "user", role: "admin" },
 *   { metadata: { alias: "user.isAdmin", tags: ["auth"], group: "user" } }
 * );
 */
export declare function check(spec: CheckSpec, options?: ExpectationCreationOptions): ExpectationNode;
/**
 * Fluent helper to create a node with alias (dot syntax support).
 *
 * @example
 * const node = node("user.isAdmin", { type: "user", role: "admin" });
 */
export declare function node(alias: string, spec: ExpectationSpec, options?: Omit<ExpectationCreationOptions, 'alias'>): ExpectationNode;
