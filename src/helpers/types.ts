import { ExpectationNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';

export type SnapshotDiff =
  | {
      id: string;
      change: 'STATUS';
      oldStatus: NodeStatus;
      newStatus: NodeStatus;
    }
  | { id: string; change: 'ADDED' }
  | { id: string; change: 'REMOVED' };

export type RootSnapshot = {
  type: 'ROOT';
  status: NodeStatus;
  child?: EvaluationSnapshot;
};

export type AndSnapshot = {
  type: 'AND';
  status: NodeStatus;
  left: EvaluationSnapshot;
  right: EvaluationSnapshot;
  id?: string;
};

export type OrSnapshot = {
  type: 'OR';
  status: NodeStatus;
  left: EvaluationSnapshot;
  right: EvaluationSnapshot;
  id?: string;
};

export type NotSnapshot = {
  type: 'NOT';
  status: NodeStatus;
  child: EvaluationSnapshot;
  id?: string;
};

export type GroupSnapshot = {
  type: 'GROUP';
  status: NodeStatus;
  child: EvaluationSnapshot;
  id?: string;
};

export type ExpectationSnapshot = {
  type: 'EXPECTATION';
  status: NodeStatus;
  id: string;
};

export type EvaluationSnapshot =
  | AndSnapshot
  | OrSnapshot
  | NotSnapshot
  | GroupSnapshot
  | ExpectationSnapshot
  | RootSnapshot;

/**
 * A map of expectation IDs to their statuses
 */
export type EvaluationMap = Map<ExpectationNode['id'], NodeStatus>;

export function snapshotIsBinary(
  snapShot: EvaluationSnapshot
): snapShot is AndSnapshot | OrSnapshot {
  return snapShot.type === 'AND' || snapShot.type === 'OR';
}

export function snapshotIsUnary(
  snapShot: EvaluationSnapshot
): snapShot is NotSnapshot | GroupSnapshot {
  return snapShot.type === 'NOT' || snapShot.type === 'GROUP';
}
