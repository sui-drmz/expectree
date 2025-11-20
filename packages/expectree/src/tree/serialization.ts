import {
  RootNode,
  Node,
  AndNode,
  OrNode,
  NotNode,
  GroupNode,
  ExpectationNode,
} from './nodes';
import { ExpectationSpec, NodeStatus } from './types';
import { NodeMetadata } from './nodes';
import { TreeState } from '../state/TreeState';
import { createIncrementalIdGenerator } from '../runtime/incrementalId';

const nextId = createIncrementalIdGenerator('exp_');

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

export type SerializedTreeNode =
  | SerializedExpectationNode
  | SerializedAndNode
  | SerializedOrNode
  | SerializedNotNode
  | SerializedGroupNode;

export interface SerializedExpectationDocument {
  version: 1;
  root: SerializedTreeNode | null;
  statuses?: Record<string, NodeStatus>;
}

export interface ExportOptions {
  includeStatuses?: boolean;
}

export function exportExpectations(
  root: RootNode,
  options: ExportOptions = {}
): SerializedExpectationDocument {
  const includeStatuses = options.includeStatuses ?? false;
  const document: SerializedExpectationDocument = {
    version: 1,
    root: root.child ? serializeNode(root.child) : null,
  };

  if (includeStatuses) {
    if (!root.hasState()) {
      throw new Error(
        'Cannot export statuses because the tree has no state attached.'
      );
    }
    const state = root.treeState;
    const statuses: Record<string, NodeStatus> = {};
    for (const [id, status] of state.nodeStates.entries()) {
      statuses[id] = status;
    }
    document.statuses = statuses;
  }

  return document;
}

export interface ImportOptions {
  preserveIds?: boolean;
  attachState?: boolean;
  applyStatuses?: boolean;
}

export function importExpectations(
  document: SerializedExpectationDocument,
  options: ImportOptions = {}
): RootNode {
  if (document.version !== 1) {
    throw new Error(
      `Unsupported expectation document version: ${document.version}`
    );
  }

  const preserveIds = options.preserveIds ?? Boolean(document.statuses);
  const config: ImportOptions = { ...options, preserveIds };

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

function serializeNode(node: Node): SerializedTreeNode {
  if (node instanceof ExpectationNode) {
    const payload: SerializedExpectationNode = {
      type: 'EXPECTATION',
      id: node.id,
      spec: node.spec,
    };
    const metadata: NodeMetadata = {};
    if (node.alias) metadata.alias = node.alias;
    if (node.tags) metadata.tags = [...node.tags];
    if (node.group) metadata.group = node.group;
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

function deserializeNode(
  data: SerializedTreeNode,
  options: ImportOptions
): Node {
  switch (data.type) {
    case 'EXPECTATION': {
      const id = options.preserveIds && data.id ? data.id : nextId();
      return new ExpectationNode(id, data.spec, data.metadata);
    }
    case 'AND':
      return new AndNode(
        deserializeNode(data.left, options),
        deserializeNode(data.right, options)
      );
    case 'OR':
      return new OrNode(
        deserializeNode(data.left, options),
        deserializeNode(data.right, options)
      );
    case 'NOT':
      return new NotNode(deserializeNode(data.child, options));
    case 'GROUP':
      return new GroupNode(deserializeNode(data.child, options));
    default:
      return exhaustive(data);
  }
}

function exhaustive(x: never): never {
  throw new Error(`Unexpected serialized node type: ${JSON.stringify(x)}`);
}
