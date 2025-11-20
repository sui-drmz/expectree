import { walkSnapshotTree } from './walkSnapshotTree';
import { EvaluationSnapshot } from './types';

/**
 * Flattens a snapshot tree into a map of expectation IDs to snapshots
 *
 * @param snapshotTree the root snapshot
 * @returns a map of expectation IDs to snapshots
 */
export function flattenSnapshot(
  snapshotTree: EvaluationSnapshot
): Map<string, EvaluationSnapshot> {
  const snapshotMap = new Map<string, EvaluationSnapshot>();

  walkSnapshotTree(snapshotTree, snapshot => {
    if (snapshot.type === 'EXPECTATION') {
      snapshotMap.set(snapshot.id, snapshot);
    }
  });

  return snapshotMap;
}
