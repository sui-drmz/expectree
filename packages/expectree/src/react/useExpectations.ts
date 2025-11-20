import { useEffect, useMemo, useState } from 'react';
import { RootNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
import { evaluateTree } from '../helpers/evaluateTree';
import { diffSnapshots } from '../helpers/diffSnapshots';

export function useExpectations(
  tree: RootNode,
  statusMap: Map<string, NodeStatus>
) {
  const [snapshot, setSnapshot] = useState(() => evaluateTree(tree, statusMap));
  const [diffs, setDiffs] = useState(
    () => [] as ReturnType<typeof diffSnapshots>
  );

  useEffect(() => {
    const next = evaluateTree(tree, statusMap);
    setDiffs(diffSnapshots(snapshot, next));
    setSnapshot(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, statusMap]);

  const rootStatus = useMemo(() => snapshot.status, [snapshot]);

  return { snapshot, rootStatus, diffs };
}
