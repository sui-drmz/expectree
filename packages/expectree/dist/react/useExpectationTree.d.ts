import { RootNode } from '../tree/nodes';
/**
 * React hook for automatic re-renders when expectations change.
 * Subscribe to a tree and get reactive updates on fulfill/reject/reset.
 *
 * @example
 * ```tsx
 * const tree = useMemo(() =>
 *   new TreeBuilder()
 *     .addExpectation(node("A", { type: "check" }))
 *     .build()
 * , []);
 *
 * const { status, snapshot, diffs, isFulfilled } = useExpectationTree(tree);
 *
 * return <div>Status: {status}</div>;
 * ```
 */
export declare function useExpectationTree(tree: RootNode): {
    snapshot: import("..").RootSnapshot;
    status: import("..").NodeStatus;
    diffs: import("..").SnapshotDiff[];
    isFulfilled: () => boolean;
    isRejected: () => boolean;
};
/**
 * Simpler hook using useState for older React versions.
 * Subscribes to tree changes and triggers re-renders.
 */
export declare function useExpectationTreeLegacy(tree: RootNode): {
    snapshot: import("..").RootSnapshot;
    status: import("..").NodeStatus;
    diffs: import("..").SnapshotDiff[];
    isFulfilled: () => boolean;
    isRejected: () => boolean;
};
