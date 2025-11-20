import { ExpectationNode, RootNode, } from '../nodes';
export function safeGet(fn) {
    try {
        return fn();
    }
    catch (_error) {
        return undefined;
    }
}
export function formatNodeLabel(node, status) {
    const statusSuffix = status === 'SKIPPED' ? ' [SKIPPED]' : '';
    switch (node.type) {
        case 'ROOT': {
            const root = node;
            const rootStatus = safeGet(() => root.status);
            return rootStatus ? `ROOT [status=${rootStatus}]` : 'ROOT';
        }
        case 'GROUP': {
            const group = node;
            const baseLabel = group.alias ? `GROUP (alias=${group.alias})` : 'GROUP';
            return baseLabel + statusSuffix;
        }
        case 'NOT': {
            return 'NOT' + statusSuffix;
        }
        case 'AND':
        case 'OR': {
            return node.type + statusSuffix;
        }
        case 'EXPECTATION': {
            const expectation = node;
            const parts = [];
            const alias = expectation.alias ?? expectation.id;
            parts.push(alias);
            if (expectation.spec?.type) {
                parts.push(`type=${String(expectation.spec.type)}`);
            }
            if (expectation.group) {
                parts.push(`group=${expectation.group}`);
            }
            if (expectation.tags?.length) {
                parts.push(`tags=${expectation.tags.join(',')}`);
            }
            const nodeStatus = status ?? safeGet(() => expectation.status);
            if (nodeStatus) {
                parts.push(`status=${nodeStatus}`);
            }
            return `EXPECTATION (${parts.join(' | ')})`;
        }
        default: {
            return node.type + statusSuffix;
        }
    }
}
export function getNodeStatus(node) {
    if (node instanceof RootNode) {
        return safeGet(() => node.status);
    }
    if (node instanceof ExpectationNode) {
        return safeGet(() => node.status);
    }
    return undefined;
}
export const __private__ = {
    safeGet,
    formatNodeLabel,
    getNodeStatus,
};
