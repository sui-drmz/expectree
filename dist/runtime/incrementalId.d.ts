/**
 * Creates a factory that generates incremental ID generators
 * @param prefix - Optional string prefix for generated IDs
 * @returns A function that generates unique, incremental IDs
 */
export declare const createIncrementalIdGenerator: (prefix?: string) => (() => string);
