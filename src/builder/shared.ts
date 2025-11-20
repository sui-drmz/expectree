import { ExpectationNode, NodeMetadata } from '../tree/nodes';
import { ExpectationSpec } from '../tree/types';
import { createIncrementalIdGenerator } from '../runtime/incrementalId';

const nextId = createIncrementalIdGenerator('exp_');

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

const dedupe = (values?: string[]): string[] | undefined => {
  if (!values) {
    return undefined;
  }
  return Array.from(new Set(values.filter(Boolean)));
};

function resolveMetadata(
  options?: ExpectationCreationOptions
): NodeMetadata | undefined {
  if (!options) {
    return undefined;
  }

  const metadata: NodeMetadata = { ...(options.metadata ?? {}) };

  const alias = options.alias ?? options.metadata?.alias ?? options.id;
  if (alias) {
    metadata.alias = alias;
  }

  const tags = options.tags ?? options.metadata?.tags;
  if (tags) {
    metadata.tags = dedupe(tags);
  } else if (metadata.tags) {
    metadata.tags = dedupe(metadata.tags);
  }

  if (options.group !== undefined) {
    metadata.group = options.group;
  }

  if (
    metadata.alias === undefined &&
    (metadata.tags === undefined || metadata.tags.length === 0) &&
    metadata.group === undefined
  ) {
    return undefined;
  }

  return metadata;
}

export function createExpectationNode(
  spec: ExpectationSpec,
  options?: ExpectationCreationOptions
): ExpectationNode {
  const metadata = resolveMetadata(options);
  return new ExpectationNode(nextId(), spec, metadata);
}
