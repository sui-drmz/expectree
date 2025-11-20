import { EvaluationSnapshot, SnapshotDiff } from './types';
/**
 * Compares two EvaluationSnapshots and returns diffs of expectation nodes.
 *
 * @param prev - The previous EvaluationSnapshot.
 * @param next - The next EvaluationSnapshot.
 * @returns An array of SnapshotDiff objects.
 */
export declare function diffSnapshots(prev: EvaluationSnapshot, next: EvaluationSnapshot): SnapshotDiff[];
