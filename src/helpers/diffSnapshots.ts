import { flattenSnapshot } from './flattenSnapshotTree';
import { EvaluationSnapshot, SnapshotDiff } from './types';

/**
 * Compares two EvaluationSnapshots and returns diffs of expectation nodes.
 *
 * @param prev - The previous EvaluationSnapshot.
 * @param next - The next EvaluationSnapshot.
 * @returns An array of SnapshotDiff objects.
 */
export function diffSnapshots(
  prev: EvaluationSnapshot,
  next: EvaluationSnapshot
): SnapshotDiff[] {
  const diffs: SnapshotDiff[] = [];

  const prevMap = flattenSnapshot(prev);
  const nextMap = flattenSnapshot(next);

  const allIds = new Set([...prevMap.keys(), ...nextMap.keys()]);

  for (const id of allIds) {
    const prevNode = prevMap.get(id);
    const nextNode = nextMap.get(id);

    if (prevNode && !nextNode) {
      diffs.push({ id, change: 'REMOVED' });
    } else if (!prevNode && nextNode) {
      diffs.push({ id, change: 'ADDED' });
    } else if (prevNode && nextNode) {
      if (prevNode.status !== nextNode.status) {
        diffs.push({
          id,
          change: 'STATUS',
          oldStatus: prevNode.status,
          newStatus: nextNode.status,
        });
      }
    }
  }

  return diffs;
}
