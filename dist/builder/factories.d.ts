import { ExpectationNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { ExpectationCreationOptions } from './shared';
export type ExpectationProps = Record<string, unknown>;
export type ExpectationCreator<TProps extends ExpectationProps> = (props: TProps, options?: ExpectationCreationOptions) => ExpectationNode;
/**
 * Helper to define typed expectation factories.
 * Example:
 *   const userCheck = defineExpectation("user")<{ role: string }>();
 *   const node = userCheck({ role: "admin" }, {
 *     metadata: { alias: "user.isAdmin", tags: ["auth"] }
 *   });
 */
export declare function defineExpectation<TType extends string>(): <TProps extends ExpectationProps>(type: TType) => ExpectationCreator<TProps>;
/**
 * Generic factory for ad-hoc specs; useful when you don't need a typed helper.
 */
export declare function expectation(spec: ExpectationSpec, options?: ExpectationCreationOptions): ExpectationNode;
