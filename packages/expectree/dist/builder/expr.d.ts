import { Node } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
export declare class NodeExpr {
    readonly node: Node;
    constructor(node: Node);
    static expect(spec: ExpectationSpec, id?: string): NodeExpr;
    and(other: NodeExpr | Node): NodeExpr;
    or(other: NodeExpr | Node): NodeExpr;
    not(): NodeExpr;
    group(): NodeExpr;
    toNode(): Node;
}
/**
 * Helper to make namespaced, typed expectation creators.
 * Usage:
 *   const cursor = defineNamespace("cursor");
 *   const at = cursor.define<"at">()("cursor.at")<{ index: number }>();
 *   const n = at({ index: 1 });
 */
export declare function defineNamespace<Prefix extends string>(prefix: Prefix): {
    define<Op extends string>(): <TProps extends Record<string, unknown>>() => (op: Op) => import("./factories").ExpectationCreator<TProps>;
    expect<TProps extends Record<string, unknown>>(op: string, props: TProps): NodeExpr;
};
