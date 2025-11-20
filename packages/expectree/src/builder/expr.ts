import { AndNode, GroupNode, Node, NotNode, OrNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { expectation as makeExpectation, defineExpectation } from './factories';

export class NodeExpr {
  readonly node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  static expect(spec: ExpectationSpec, id?: string): NodeExpr {
    return new NodeExpr(makeExpectation(spec, id ? { id } : undefined));
  }

  and(other: NodeExpr | Node): NodeExpr {
    const rhs = other instanceof NodeExpr ? other.node : other;
    return new NodeExpr(new AndNode(this.node, rhs));
  }

  or(other: NodeExpr | Node): NodeExpr {
    const rhs = other instanceof NodeExpr ? other.node : other;
    return new NodeExpr(new OrNode(this.node, rhs));
  }

  not(): NodeExpr {
    return new NodeExpr(new NotNode(this.node));
  }

  group(): NodeExpr {
    return new NodeExpr(new GroupNode(this.node));
  }

  toNode(): Node {
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
export function defineNamespace<Prefix extends string>(prefix: Prefix) {
  return {
    define<Op extends string>() {
      return function factory<TProps extends Record<string, unknown>>() {
        const make = defineExpectation<`${Prefix}.${Op}`>()<TProps>;
        return (op: Op) => make(`${prefix}.${op}` as `${Prefix}.${Op}`);
      };
    },
    expect<TProps extends Record<string, unknown>>(op: string, props: TProps) {
      return NodeExpr.expect({ type: `${prefix}.${op}`, ...props });
    },
  };
}
