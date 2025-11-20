import { EvaluationSnapshot } from './types';
/**
 * Flattens a snapshot tree into a map of expectation IDs to snapshots
 *
 * @param snapshotTree the root snapshot
 * @returns a map of expectation IDs to snapshots
 */
export declare function flattenSnapshot(snapshotTree: EvaluationSnapshot): Map<string, EvaluationSnapshot>;
