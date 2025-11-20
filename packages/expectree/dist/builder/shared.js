import { ExpectationNode } from '../tree/nodes';
import { createIncrementalIdGenerator } from '../runtime/incrementalId';
const nextId = createIncrementalIdGenerator('exp_');
const dedupe = (values) => {
    if (!values) {
        return undefined;
    }
    return Array.from(new Set(values.filter(Boolean)));
};
function resolveMetadata(options) {
    if (!options) {
        return undefined;
    }
    const metadata = { ...(options.metadata ?? {}) };
    const alias = options.alias ?? options.metadata?.alias ?? options.id;
    if (alias) {
        metadata.alias = alias;
    }
    const tags = options.tags ?? options.metadata?.tags;
    if (tags) {
        metadata.tags = dedupe(tags);
    }
    else if (metadata.tags) {
        metadata.tags = dedupe(metadata.tags);
    }
    if (options.group !== undefined) {
        metadata.group = options.group;
    }
    if (metadata.alias === undefined &&
        (metadata.tags === undefined || metadata.tags.length === 0) &&
        metadata.group === undefined) {
        return undefined;
    }
    return metadata;
}
export function createExpectationNode(spec, options) {
    const metadata = resolveMetadata(options);
    return new ExpectationNode(nextId(), spec, metadata);
}
