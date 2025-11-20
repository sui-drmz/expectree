/**
 * Base error class for all expectation tree-related errors
 */
export declare abstract class ExpectationTreeError extends Error {
    abstract readonly name: string;
}
/**
 * Error thrown when trying to add another node without a logical operator
 */
export declare class MissingOperatorError extends ExpectationTreeError {
    readonly name = "MissingOperatorError";
    constructor();
}
/**
 * Error thrown when an operation is missing an operand
 */
export declare class MissingOperandError extends ExpectationTreeError {
    readonly name = "MissingOperandError";
    constructor(operation: string);
}
/**
 * Error thrown when a group operation is empty
 */
export declare class EmptyGroupError extends ExpectationTreeError {
    readonly name = "EmptyGroupError";
    constructor();
}
/**
 * Error thrown when an operation is incomplete
 */
export declare class IncompleteOperationError extends ExpectationTreeError {
    readonly name = "IncompleteOperationError";
    constructor(operation: string);
}
/**
 * Error thrown when multiple nodes remain in the stack
 */
export declare class MultipleNodesError extends ExpectationTreeError {
    readonly name = "MultipleNodesError";
    constructor();
}
/**
 * Error specifically for when trying to add an expectation without specifying how to combine with existing expectations
 */
export declare class ExpectationCombinationError extends ExpectationTreeError {
    readonly name = "ExpectationCombinationError";
    constructor();
}
/**
 * Error thrown when duplicate node IDs are detected within a tree.
 */
export declare class DuplicateNodeIdError extends ExpectationTreeError {
    readonly name = "DuplicateNodeIdError";
    constructor(id: string);
}
/**
 * Error thrown when duplicate aliases (including nested paths) are detected.
 */
export declare class DuplicateAliasError extends ExpectationTreeError {
    readonly name = "DuplicateAliasError";
    constructor(alias: string);
}
/**
 * Error thrown when trying to build an empty tree
 */
export declare class EmptyTreeError extends ExpectationTreeError {
    readonly name = "EmptyTreeError";
    constructor();
}
