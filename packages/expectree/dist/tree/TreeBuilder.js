import { AndNode, GroupNode, NotNode, OrNode, RootNode } from './nodes';
import { EmptyGroupError, EmptyTreeError, ExpectationCombinationError, IncompleteOperationError, MissingOperandError, MultipleNodesError, } from './exceptions';
import { visualizeTree } from './visualizers';
export class TreeBuilder {
    root;
    /**
     * Stack of nodes that tracks the state of expression building.
     * Nodes are pushed when expectations are created and popped when operations are applied.
     *
     */
    nodeStack = [];
    /** Tracks the pending logical operation to apply when the next node is added */
    pendingOperation = null;
    constructor() {
        this.root = new RootNode();
    }
    /**
     * Groups multiple expectations together
     * Useful for combining complex expressions
     */
    group(fn, options = {}) {
        const builder = new TreeBuilder();
        let root;
        try {
            root = fn(builder).build({ attachState: false });
        }
        catch (err) {
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
            }
            else if (this.pendingOperation === 'OR') {
                this.nodeStack.push(new OrNode(leftNode, group));
            }
            this.pendingOperation = null;
        }
        else {
            this.nodeStack.push(group);
        }
        return this;
    }
    /**
     * Marks that the next expectation should be combined with the current one using AND
     */
    and() {
        if (this.nodeStack.length === 0) {
            throw new MissingOperandError('left');
        }
        this.pendingOperation = 'AND';
        return this;
    }
    /**
     * Marks that the next expectation should be combined with the current one using OR
     */
    or() {
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
    not() {
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
    addExpectation(node) {
        if (this.pendingOperation && this.nodeStack.length > 0) {
            const leftNode = this.nodeStack.pop();
            if (!leftNode) {
                throw new Error('Expected node on stack');
            }
            // AND has a higher precedence than OR
            if (this.pendingOperation === 'AND') {
                this.nodeStack.push(new AndNode(leftNode, node));
            }
            else if (this.pendingOperation === 'OR') {
                this.nodeStack.push(new OrNode(leftNode, node));
            }
            this.pendingOperation = null;
        }
        else {
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
    build(options = {}) {
        return this.finalize(options, { mutate: true });
    }
    visualize(options) {
        const root = this.finalize({ attachState: false }, { mutate: false });
        return visualizeTree(root, options);
    }
    finalize(options, { mutate }) {
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
