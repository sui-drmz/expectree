import { Node, RootNode } from './nodes';
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
export declare class TreeBuilder {
    private root;
    /**
     * Stack of nodes that tracks the state of expression building.
     * Nodes are pushed when expectations are created and popped when operations are applied.
     *
     */
    private nodeStack;
    /** Tracks the pending logical operation to apply when the next node is added */
    private pendingOperation;
    constructor();
    /**
     * Groups multiple expectations together
     * Useful for combining complex expressions
     */
    group(fn: (builder: TreeBuilder) => TreeBuilder, options?: GroupOptions): TreeBuilder;
    /**
     * Marks that the next expectation should be combined with the current one using AND
     */
    and(): TreeBuilder;
    /**
     * Marks that the next expectation should be combined with the current one using OR
     */
    or(): TreeBuilder;
    /**
     * Negates the current expectation
     * Pops one node from the stack and pushes a NOT node back
     */
    not(): TreeBuilder;
    /**
     * Adds an expectation node to the tree
     * Pushes an expectation node onto the stack
     * If there's a pending operation, applies it with the previous node
     */
    addExpectation(node: Node): TreeBuilder;
    /**
     * Builds the final tree by adding all nodes from the stack to the root
     * - If stack is empty, returns the root as is
     * - If multiple nodes remain on stack, throws an error (use group() instead)
     * - Otherwise adds the final node to the root and returns it
     */
    build(options?: BuildOptions): RootNode;
    visualize(options?: VisualizeParam): string;
    private finalize;
}
export {};
