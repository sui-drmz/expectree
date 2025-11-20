import { RootNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { TreeBuilder } from '../tree/TreeBuilder';
import { ExpectationNode, Node } from '../tree/nodes';
import type { VisualizeParam } from '../tree/visualizers/types';
export declare class FluentBuilder {
    private readonly builder;
    constructor(builder?: TreeBuilder);
    /**
     * Add an expectation by spec
     */
    expect(spec: ExpectationSpec, id?: string): this;
    /**
     * Add a pre-created expectation node
     */
    add(node: ExpectationNode): this;
    /**
     * Combine with the next expectation using AND
     */
    and(): this;
    /**
     * Combine with the next expectation using OR
     */
    or(): this;
    /**
     * Negate the current expression
     */
    not(): this;
    /**
     * Group a sub-expression
     */
    group(fn: (b: FluentBuilder) => void, options?: {
        alias?: string;
    }): this;
    /**
     * Low-level escape hatch to add any node (including groups or logical nodes)
     */
    node(node: Node): this;
    /**
     * Finalize and return the root node
     */
    build(): RootNode;
    /**
     * Render the current tree using a registered visualizer
     */
    visualize(options?: VisualizeParam): string;
}
