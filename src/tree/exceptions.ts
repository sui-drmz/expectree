/**
 * Base error class for all expectation tree-related errors
 */
export abstract class ExpectationTreeError extends Error {
  abstract readonly name: string;
}

/**
 * Error thrown when trying to add another node without a logical operator
 */
export class MissingOperatorError extends ExpectationTreeError {
  readonly name = 'MissingOperatorError';
  constructor() {
    super(
      'Cannot add another node without a logical operator. Use .and() or .or() between nodes.'
    );
  }
}

/**
 * Error thrown when an operation is missing an operand
 */
export class MissingOperandError extends ExpectationTreeError {
  readonly name = 'MissingOperandError';
  constructor(operation: string) {
    super(`No ${operation} operand provided`);
  }
}

/**
 * Error thrown when a group operation is empty
 */
export class EmptyGroupError extends ExpectationTreeError {
  readonly name = 'EmptyGroupError';
  constructor() {
    super('Group must contain at least one node');
  }
}

/**
 * Error thrown when an operation is incomplete
 */
export class IncompleteOperationError extends ExpectationTreeError {
  readonly name = 'IncompleteOperationError';
  constructor(operation: string) {
    super(`Incomplete ${operation} operation. Add another expectation.`);
  }
}

/**
 * Error thrown when multiple nodes remain in the stack
 */
export class MultipleNodesError extends ExpectationTreeError {
  readonly name = 'MultipleNodesError';
  constructor() {
    super('Multiple nodes in stack. Use .group() to combine them.');
  }
}

/**
 * Error specifically for when trying to add an expectation without specifying how to combine with existing expectations
 */
export class ExpectationCombinationError extends ExpectationTreeError {
  readonly name = 'ExpectationCombinationError';
  constructor() {
    super(
      'Cannot add another expectation - you must specify how to combine it with the existing expectation. Use .and() or .or() between expectations.'
    );
  }
}

/**
 * Error thrown when duplicate node IDs are detected within a tree.
 */
export class DuplicateNodeIdError extends ExpectationTreeError {
  readonly name = 'DuplicateNodeIdError';
  constructor(id: string) {
    super(`Duplicate expectation ID detected: "${id}". IDs must be unique.`);
  }
}

/**
 * Error thrown when duplicate aliases (including nested paths) are detected.
 */
export class DuplicateAliasError extends ExpectationTreeError {
  readonly name = 'DuplicateAliasError';
  constructor(alias: string) {
    super(
      `Duplicate expectation alias detected: "${alias}". Aliases must be unique.`
    );
  }
}

/**
 * Error thrown when trying to build an empty tree
 */
export class EmptyTreeError extends ExpectationTreeError {
  readonly name = 'EmptyTreeError';
  constructor() {
    super(
      'Cannot build or evaluate an empty tree. Add at least one expectation.'
    );
  }
}
