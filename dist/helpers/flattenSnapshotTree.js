import { walkSnapshotTree } from './walkSnapshotTree';
/**
 * Flattens a snapshot tree into a map of expectation IDs to snapshots
 *
 * @param snapshotTree the root snapshot
 * @returns a map of expectation IDs to snapshots
 */
export function flattenSnapshot(snapshotTree) {
    const snapshotMap = new Map();
    walkSnapshotTree(snapshotTree, snapshot => {
        if (snapshot.type === 'EXPECTATION') {
            snapshotMap.set(snapshot.id, snapshot);
        }
    });
    return snapshotMap;
}
