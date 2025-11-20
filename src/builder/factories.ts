import { ExpectationNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { ExpectationCreationOptions, createExpectationNode } from './shared';

export type ExpectationProps = Record<string, unknown>;

export type ExpectationCreator<TProps extends ExpectationProps> = (
  props: TProps,
  options?: ExpectationCreationOptions
) => ExpectationNode;

/**
 * Helper to define typed expectation factories.
 * Example:
 *   const userCheck = defineExpectation("user")<{ role: string }>();
 *   const node = userCheck({ role: "admin" }, {
 *     metadata: { alias: "user.isAdmin", tags: ["auth"] }
 *   });
 */
export function defineExpectation<TType extends string>() {
  return function factory<TProps extends ExpectationProps>(
    type: TType
  ): ExpectationCreator<TProps> {
    return (props: TProps, options?: ExpectationCreationOptions) => {
      const spec: ExpectationSpec = { type, ...props };
      return createExpectationNode(spec, options);
    };
  };
}

/**
 * Generic factory for ad-hoc specs; useful when you don't need a typed helper.
 */
export function expectation(
  spec: ExpectationSpec,
  options?: ExpectationCreationOptions
): ExpectationNode {
  return createExpectationNode(spec, options);
}
