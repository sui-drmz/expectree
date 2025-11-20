import { ExpectationNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { ExpectationCreationOptions, createExpectationNode } from './shared';
export { FluentBuilder } from './fluent';
export { defineExpectation, expectation } from './factories';
export { NodeExpr, defineNamespace } from './expr';
export type { ExpectationCreationOptions } from './shared';

export function createExpectation(
  spec: ExpectationSpec,
  options?: ExpectationCreationOptions
): ExpectationNode {
  return createExpectationNode(spec, options);
}

export type CheckSpec = ExpectationSpec & { type: string };

/**
 * Create a node with optional metadata for tagging/aliasing.
 *
 * @example
 * const node = check(
 *   { type: "user", role: "admin" },
 *   { metadata: { alias: "user.isAdmin", tags: ["auth"], group: "user" } }
 * );
 */
export function check(
  spec: CheckSpec,
  options?: ExpectationCreationOptions
): ExpectationNode {
  return createExpectation(spec, options);
}

/**
 * Fluent helper to create a node with alias (dot syntax support).
 *
 * @example
 * const node = node("user.isAdmin", { type: "user", role: "admin" });
 */
export function node(
  alias: string,
  spec: ExpectationSpec,
  options?: Omit<ExpectationCreationOptions, 'alias'>
): ExpectationNode {
  return createExpectation(spec, {
    ...options,
    alias,
  });
}
