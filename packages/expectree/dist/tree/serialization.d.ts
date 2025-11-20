import { RootNode } from './nodes';
import { ExpectationSpec, NodeStatus } from './types';
import { NodeMetadata } from './nodes';
export interface SerializedExpectationNode {
    type: 'EXPECTATION';
    id?: string;
    spec: ExpectationSpec;
    metadata?: NodeMetadata;
}
export interface SerializedAndNode {
    type: 'AND';
    left: SerializedTreeNode;
    right: SerializedTreeNode;
}
export interface SerializedOrNode {
    type: 'OR';
    left: SerializedTreeNode;
    right: SerializedTreeNode;
}
export interface SerializedNotNode {
    type: 'NOT';
    child: SerializedTreeNode;
}
export interface SerializedGroupNode {
    type: 'GROUP';
    child: SerializedTreeNode;
}
export type SerializedTreeNode = SerializedExpectationNode | SerializedAndNode | SerializedOrNode | SerializedNotNode | SerializedGroupNode;
export interface SerializedExpectationDocument {
    version: 1;
    root: SerializedTreeNode | null;
    statuses?: Record<string, NodeStatus>;
}
export interface ExportOptions {
    includeStatuses?: boolean;
}
export declare function exportExpectations(root: RootNode, options?: ExportOptions): SerializedExpectationDocument;
export interface ImportOptions {
    preserveIds?: boolean;
    attachState?: boolean;
    applyStatuses?: boolean;
}
export declare function importExpectations(document: SerializedExpectationDocument, options?: ImportOptions): RootNode;
