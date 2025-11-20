import { Node } from '../nodes';
export declare function safeGet<T>(fn: () => T): T | undefined;
export declare function formatNodeLabel(node: Node, status?: string): string;
export declare function getNodeStatus(node: Node): string | undefined;
export declare const __private__: {
    safeGet: typeof safeGet;
    formatNodeLabel: typeof formatNodeLabel;
    getNodeStatus: typeof getNodeStatus;
};
