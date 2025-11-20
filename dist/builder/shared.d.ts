import { ExpectationNode, NodeMetadata } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
export interface ExpectationCreationOptions {
    /**
     * Human-friendly alias for selectors. Supports dot notation.
     */
    alias?: string;
    /**
     * Legacy identifier. Treated as an alias for backwards compatibility.
     */
    id?: string;
    /**
     * Tags to attach to the expectation.
     */
    tags?: string[];
    /**
     * Group label for selectors.
     */
    group?: string;
    /**
     * Additional metadata overrides.
     */
    metadata?: NodeMetadata;
}
export declare function createExpectationNode(spec: ExpectationSpec, options?: ExpectationCreationOptions): ExpectationNode;
