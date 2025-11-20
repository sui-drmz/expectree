import {
  ExpectationNode,
  GroupNode,
  Node,
  RootNode,
} from '../nodes';

export function safeGet<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch (_error) {
    return undefined;
  }
}

export function formatNodeLabel(node: Node): string {
  switch (node.type) {
    case 'ROOT': {
      const root = node as RootNode;
      const status = safeGet(() => root.status);
      return status ? `ROOT [status=${status}]` : 'ROOT';
    }
    case 'GROUP': {
      const group = node as GroupNode;
      return group.alias ? `GROUP (alias=${group.alias})` : 'GROUP';
    }
    case 'NOT': {
      return 'NOT';
    }
    case 'AND':
    case 'OR': {
      return node.type;
    }
    case 'EXPECTATION': {
      const expectation = node as ExpectationNode;
      const parts: string[] = [];
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
      const status = safeGet(() => expectation.status);
      if (status) {
        parts.push(`status=${status}`);
      }
      return `EXPECTATION (${parts.join(' | ')})`;
    }
    default: {
      return node.type;
    }
  }
}

export function getNodeStatus(node: Node): string | undefined {
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

