import { useEffect, useState, useSyncExternalStore } from 'react';
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
export function useExpectationTree(tree) {
    // Use React 18's useSyncExternalStore for proper concurrent mode support
    const snapshot = useSyncExternalStore(callback => tree.subscribe(() => callback()), () => tree.snapshot, () => tree.snapshot);
    return {
        snapshot,
        status: tree.status,
        diffs: tree.diffs,
        isFulfilled: () => tree.isFulfilled(),
        isRejected: () => tree.isRejected(),
    };
}
/**
 * Simpler hook using useState for older React versions.
 * Subscribes to tree changes and triggers re-renders.
 */
export function useExpectationTreeLegacy(tree) {
    const [, forceUpdate] = useState({});
    useEffect(() => {
        const unsubscribe = tree.subscribe(() => {
            forceUpdate({});
        });
        return unsubscribe;
    }, [tree]);
    return {
        snapshot: tree.snapshot,
        status: tree.status,
        diffs: tree.diffs,
        isFulfilled: () => tree.isFulfilled(),
        isRejected: () => tree.isRejected(),
    };
}
