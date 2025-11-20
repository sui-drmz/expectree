import { RootNode, AndNode, OrNode, NotNode, GroupNode, ExpectationNode, } from './nodes';
import { TreeState } from '../state/TreeState';
import { createIncrementalIdGenerator } from '../runtime/incrementalId';
const nextId = createIncrementalIdGenerator('exp_');
export function exportExpectations(root, options = {}) {
    const includeStatuses = options.includeStatuses ?? false;
    const document = {
        version: 1,
        root: root.child ? serializeNode(root.child) : null,
    };
    if (includeStatuses) {
        if (!root.hasState()) {
            throw new Error('Cannot export statuses because the tree has no state attached.');
        }
        const state = root.treeState;
        const statuses = {};
        for (const [id, status] of state.nodeStates.entries()) {
            statuses[id] = status;
        }
        document.statuses = statuses;
    }
    return document;
}
export function importExpectations(document, options = {}) {
    if (document.version !== 1) {
        throw new Error(`Unsupported expectation document version: ${document.version}`);
    }
    const preserveIds = options.preserveIds ?? Boolean(document.statuses);
    const config = { ...options, preserveIds };
    const child = document.root
        ? deserializeNode(document.root, config)
        : undefined;
    const root = new RootNode(child);
    root.rebuildIndexes();
    if (options.attachState !== false) {
        let state = TreeState.create(root);
        if (document.statuses && config.applyStatuses !== false) {
            state = state.update(document.statuses);
        }
        root.initializeState(state);
    }
    return root;
}
function serializeNode(node) {
    if (node instanceof ExpectationNode) {
        const payload = {
            type: 'EXPECTATION',
            id: node.id,
            spec: node.spec,
        };
        const metadata = {};
        if (node.alias)
            metadata.alias = node.alias;
        if (node.tags)
            metadata.tags = [...node.tags];
        if (node.group)
            metadata.group = node.group;
        if (Object.keys(metadata).length > 0) {
            payload.metadata = metadata;
        }
        return payload;
    }
    if (node instanceof AndNode) {
        return {
            type: 'AND',
            left: serializeNode(node.left),
            right: serializeNode(node.right),
        };
    }
    if (node instanceof OrNode) {
        return {
            type: 'OR',
            left: serializeNode(node.left),
            right: serializeNode(node.right),
        };
    }
    if (node instanceof NotNode) {
        return {
            type: 'NOT',
            child: serializeNode(node.child),
        };
    }
    if (node instanceof GroupNode) {
        return {
            type: 'GROUP',
            child: serializeNode(node.child),
        };
    }
    throw new Error(`Unsupported node type: ${node.type}`);
}
function deserializeNode(data, options) {
    switch (data.type) {
        case 'EXPECTATION': {
            const id = options.preserveIds && data.id ? data.id : nextId();
            return new ExpectationNode(id, data.spec, data.metadata);
        }
        case 'AND':
            return new AndNode(deserializeNode(data.left, options), deserializeNode(data.right, options));
        case 'OR':
            return new OrNode(deserializeNode(data.left, options), deserializeNode(data.right, options));
        case 'NOT':
            return new NotNode(deserializeNode(data.child, options));
        case 'GROUP':
            return new GroupNode(deserializeNode(data.child, options));
        default:
            return exhaustive(data);
    }
}
function exhaustive(x) {
    throw new Error(`Unexpected serialized node type: ${JSON.stringify(x)}`);
}
