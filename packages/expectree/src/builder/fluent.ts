import { RootNode } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { TreeBuilder } from '../tree/TreeBuilder';
import { expectation as makeExpectation } from './factories';
import { ExpectationNode, Node } from '../tree/nodes';
import type { VisualizeParam } from '../tree/visualizers/types';

export class FluentBuilder {
  private readonly builder: TreeBuilder;

  constructor(builder?: TreeBuilder) {
    this.builder = builder ?? new TreeBuilder();
  }

  /**
   * Add an expectation by spec
   */
  expect(spec: ExpectationSpec, id?: string): this {
    const node = makeExpectation(spec, id ? { id } : undefined);
    this.builder.addExpectation(node);
    return this;
  }

  /**
   * Add a pre-created expectation node
   */
  add(node: ExpectationNode): this {
    this.builder.addExpectation(node);
    return this;
  }

  /**
   * Combine with the next expectation using AND
   */
  and(): this {
    this.builder.and();
    return this;
  }

  /**
   * Combine with the next expectation using OR
   */
  or(): this {
    this.builder.or();
    return this;
  }

  /**
   * Negate the current expression
   */
  not(): this {
    this.builder.not();
    return this;
  }

  /**
   * Group a sub-expression
   */
  group(
    fn: (b: FluentBuilder) => void,
    options: { alias?: string } = {}
  ): this {
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
  node(node: Node): this {
    this.builder.addExpectation(node);
    return this;
  }

  /**
   * Finalize and return the root node
   */
  build(): RootNode {
    return this.builder.build();
  }

  /**
   * Render the current tree using a registered visualizer
   */
  visualize(options?: VisualizeParam): string {
    return this.builder.visualize(options);
  }
}
