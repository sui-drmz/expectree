import { AndNode, GroupNode, Node, NotNode, OrNode, RootNode } from './nodes';

import {
  EmptyGroupError,
  EmptyTreeError,
  ExpectationCombinationError,
  IncompleteOperationError,
  MissingOperandError,
  MultipleNodesError,
} from './exceptions';

import { LogicalOperator } from './types';
import { visualizeTree } from './visualizers';
import type { VisualizeParam } from './visualizers/types';

/**
 * TreeBuilder - Constructs expression trees for expectations using a stack-based approach.
 *
 * This class uses a stack data structure (nodeStack) to build complex logical expressions:
 * - Each expectation pushes a node onto the stack
 * - Logical operations (AND, OR, NOT) pop nodes from the stack and push result nodes back
 * - The build() method finalizes the tree by adding the remaining node to the root
 *
 * Implementation notes:
 * - Inspired by the Shunting Yard algorithm (Dijkstra, 1961) for parsing expressions
 * - Uses principles from postfix notation (Reverse Polish Notation) evaluation
 * - Builds an Abstract Syntax Tree (AST) for the logical expressions
 * - Similar to how compilers build expression trees for evaluation
 *
 * Algorithm Flowchart:
 * ```
 * ┌───────────────────────┐
 * │      Initialize       │
 * │    nodeStack = []     │
 * └──────────┬────────────┘
 *            │
 *            ▼
 * ┌───────────────────────┐         ┌───────────────────────┐
 * │  Create Expectation   │         │   Logical Operators   │
 * │  cursor/document/etc  │         │                       │
 * └──────────┬────────────┘         │  ┌─────────────────┐  │
 *            │                      │  │    and()/or()   │  │
 *            ▼                      │  │ Set pending op  │  │
 * ┌───────────────────────┐◄────────┘  └────────┬────────┘  │
 * │   addExpectation()    │◄─────────────────┐  │           │
 * └──────────┬────────────┘                  │  │           │
 *            │                      ┌────────┘  │           │
 *            ▼                      │           │           │
 * ┌───────────────────────┐         │           │           │
 * │ pendingOperation?     │─────Yes─┘           │           │
 * └──────────┬────────────┘                     │           │
 *            │No                                │           │
 *            ▼                                  │           │
 * ┌───────────────────────┐                     │           │
 * │ Push node to stack    │                     │           │
 * └──────────┬────────────┘                     │           │
 *            │                                  │           │
 *            └─────────────┬───────────────────┬┘           │
 *                          │                   │            │
 *                          │                   │            │
 *               ┌──────────▼───────┐  ┌────────▼─────────┐  │
 *               │      not()       │  │     group()      │  │
 *               │ Pop & wrap node  │  │ Create sub-tree  │  │
 *               └──────────┬───────┘  └──────────┬───────┘  │
 *                          │                     │          │
 *                          └──────┐     ┌────────┘          │
 *                                 │     │                   │
 *                                 └─────┴───────────────────┘
 *                                    │
 *                                    │
 *                                    ▼
 *                          ┌───────────────────────┐
 *                          │       build()         │
 *                          │ Finalize expression   │
 *                          └───────────────────────┘
 * ```
 *
 * Example usage:
 * ```
 * builder.cursor().toBe().at(1)  // Pushes expectation node to stack
 *        .and()                  // Pops two nodes, pushes AND node
 *        .cursor().toBe().at(2)  // Pushes expectation node to stack
 *        .build()                // Finalizes the tree
 * ```
 */
export interface BuildOptions {
  /**
   * When false, the resulting tree is returned without attaching a TreeState instance.
   * Useful for intermediate builders (e.g. nested group calls) that only need the
   * structural nodes.
   */
  attachState?: boolean;
}

interface GroupOptions {
  alias?: string;
}

export class TreeBuilder {
  private root: RootNode;

  /**
   * Stack of nodes that tracks the state of expression building.
   * Nodes are pushed when expectations are created and popped when operations are applied.
   *
   */
  private nodeStack: Node[] = [];
  /** Tracks the pending logical operation to apply when the next node is added */

  private pendingOperation: LogicalOperator | null = null;

  constructor() {
    this.root = new RootNode();
  }

  /**
   * Groups multiple expectations together
   * Useful for combining complex expressions
   */
  group(
    fn: (builder: TreeBuilder) => TreeBuilder,
    options: GroupOptions = {}
  ): TreeBuilder {
    const builder = new TreeBuilder();
    let root: RootNode;
    try {
      root = fn(builder).build({ attachState: false });
    } catch (err) {
      if (err instanceof EmptyTreeError) {
        throw new EmptyGroupError();
      }
      throw err;
    }

    if (root.isEmpty()) {
      throw new EmptyGroupError();
    }

    const child = root.child;
    if (!child) {
      throw new EmptyGroupError();
    }

    const group = new GroupNode(child, options.alias);
    // Apply any pending operation with the group node, mirroring addExpectation behavior
    if (this.pendingOperation && this.nodeStack.length > 0) {
      const leftNode = this.nodeStack.pop();
      if (!leftNode) {
        throw new Error('Expected node on stack');
      }
      if (this.pendingOperation === 'AND') {
        this.nodeStack.push(new AndNode(leftNode, group));
      } else if (this.pendingOperation === 'OR') {
        this.nodeStack.push(new OrNode(leftNode, group));
      }
      this.pendingOperation = null;
    } else {
      this.nodeStack.push(group);
    }
    return this;
  }

  /**
   * Marks that the next expectation should be combined with the current one using AND
   */
  and(): TreeBuilder {
    if (this.nodeStack.length === 0) {
      throw new MissingOperandError('left');
    }
    this.pendingOperation = 'AND';
    return this;
  }

  /**
   * Marks that the next expectation should be combined with the current one using OR
   */
  or(): TreeBuilder {
    if (this.nodeStack.length === 0) {
      throw new MissingOperandError('left');
    }
    this.pendingOperation = 'OR';
    return this;
  }

  /**
   * Negates the current expectation
   * Pops one node from the stack and pushes a NOT node back
   */
  not(): TreeBuilder {
    const node = this.nodeStack.pop();
    if (!node) {
      throw new MissingOperandError('NOT');
    }
    this.nodeStack.push(new NotNode(node));
    return this;
  }

  /**
   * Adds an expectation node to the tree
   * Pushes an expectation node onto the stack
   * If there's a pending operation, applies it with the previous node
   */
  addExpectation(node: Node): TreeBuilder {
    if (this.pendingOperation && this.nodeStack.length > 0) {
      const leftNode = this.nodeStack.pop();
      if (!leftNode) {
        throw new Error('Expected node on stack');
      }

      // AND has a higher precedence than OR
      if (this.pendingOperation === 'AND') {
        this.nodeStack.push(new AndNode(leftNode, node));
      } else if (this.pendingOperation === 'OR') {
        this.nodeStack.push(new OrNode(leftNode, node));
      }
      this.pendingOperation = null;
    } else {
      // If there's already a node in the stack but no pending operation,
      // throw an error as we're trying to add a node without specifying how to combine it
      if (this.nodeStack.length > 0) {
        throw new ExpectationCombinationError();
      }
      this.nodeStack.push(node);
    }

    return this;
  }

  /**
   * Builds the final tree by adding all nodes from the stack to the root
   * - If stack is empty, returns the root as is
   * - If multiple nodes remain on stack, throws an error (use group() instead)
   * - Otherwise adds the final node to the root and returns it
   */
  build(options: BuildOptions = {}): RootNode {
    return this.finalize(options, { mutate: true });
  }

  visualize(options?: VisualizeParam): string {
    const root = this.finalize({ attachState: false }, { mutate: false });
    return visualizeTree(root, options);
  }

  private finalize(
    options: BuildOptions,
    { mutate }: { mutate: boolean }
  ): RootNode {
    if (this.pendingOperation) {
      throw new IncompleteOperationError(this.pendingOperation.toUpperCase());
    }

    const stack = mutate ? this.nodeStack : [...this.nodeStack];

    if (stack.length === 0) {
      if (this.root.isEmpty()) {
        throw new EmptyTreeError();
      }
      if (!mutate) {
        this.root.rebuildIndexes();
      }
      return this.root;
    }

    if (stack.length > 1) {
      throw new MultipleNodesError();
    }

    const finalNode = mutate ? stack.pop() : stack[stack.length - 1];
    if (!finalNode) {
      throw new Error('Expected final node on stack');
    }

    if (!mutate) {
      const previewRoot = new RootNode(finalNode);
      previewRoot.rebuildIndexes();
      if (options.attachState !== false) {
        previewRoot.initializeState();
      }
      return previewRoot;
    }

    this.root = new RootNode(finalNode);
    this.root.rebuildIndexes();
    if (options.attachState !== false) {
      this.root.initializeState();
    }
    return this.root;
  }
}
