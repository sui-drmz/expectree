import { AndNode, GroupNode, NotNode, OrNode } from '../tree/nodes';
import { expectation as makeExpectation, defineExpectation } from './factories';
export class NodeExpr {
    node;
    constructor(node) {
        this.node = node;
    }
    static expect(spec, id) {
        return new NodeExpr(makeExpectation(spec, id ? { id } : undefined));
    }
    and(other) {
        const rhs = other instanceof NodeExpr ? other.node : other;
        return new NodeExpr(new AndNode(this.node, rhs));
    }
    or(other) {
        const rhs = other instanceof NodeExpr ? other.node : other;
        return new NodeExpr(new OrNode(this.node, rhs));
    }
    not() {
        return new NodeExpr(new NotNode(this.node));
    }
    group() {
        return new NodeExpr(new GroupNode(this.node));
    }
    toNode() {
        return this.node;
    }
}
/**
 * Helper to make namespaced, typed expectation creators.
 * Usage:
 *   const cursor = defineNamespace("cursor");
 *   const at = cursor.define<"at">()("cursor.at")<{ index: number }>();
 *   const n = at({ index: 1 });
 */
export function defineNamespace(prefix) {
    return {
        define() {
            return function factory() {
                const make = (defineExpectation());
                return (op) => make(`${prefix}.${op}`);
            };
        },
        expect(op, props) {
            return NodeExpr.expect({ type: `${prefix}.${op}`, ...props });
        },
    };
}
