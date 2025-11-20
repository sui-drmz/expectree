import { TreeBuilder } from '../tree/TreeBuilder';
import { expectation as makeExpectation } from './factories';
export class FluentBuilder {
    builder;
    constructor(builder) {
        this.builder = builder ?? new TreeBuilder();
    }
    /**
     * Add an expectation by spec
     */
    expect(spec, id) {
        const node = makeExpectation(spec, id ? { id } : undefined);
        this.builder.addExpectation(node);
        return this;
    }
    /**
     * Add a pre-created expectation node
     */
    add(node) {
        this.builder.addExpectation(node);
        return this;
    }
    /**
     * Combine with the next expectation using AND
     */
    and() {
        this.builder.and();
        return this;
    }
    /**
     * Combine with the next expectation using OR
     */
    or() {
        this.builder.or();
        return this;
    }
    /**
     * Negate the current expression
     */
    not() {
        this.builder.not();
        return this;
    }
    /**
     * Group a sub-expression
     */
    group(fn, options = {}) {
        this.builder.group(tb => {
            const fb = new FluentBuilder(tb);
            fn(fb);
            return tb;
        }, options);
        return this;
    }
    /**
     * Low-level escape hatch to add any node (including groups or logical nodes)
     */
    node(node) {
        this.builder.addExpectation(node);
        return this;
    }
    /**
     * Finalize and return the root node
     */
    build() {
        return this.builder.build();
    }
    /**
     * Render the current tree using a registered visualizer
     */
    visualize(options) {
        return this.builder.visualize(options);
    }
}
