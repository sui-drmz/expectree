import { createExpectationNode } from './shared';
/**
 * Helper to define typed expectation factories.
 * Example:
 *   const userCheck = defineExpectation("user")<{ role: string }>();
 *   const node = userCheck({ role: "admin" }, {
 *     metadata: { alias: "user.isAdmin", tags: ["auth"] }
 *   });
 */
export function defineExpectation() {
    return function factory(type) {
        return (props, options) => {
            const spec = { type, ...props };
            return createExpectationNode(spec, options);
        };
    };
}
/**
 * Generic factory for ad-hoc specs; useful when you don't need a typed helper.
 */
export function expectation(spec, options) {
    return createExpectationNode(spec, options);
}
