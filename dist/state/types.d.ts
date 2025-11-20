import { ExpectationNode, RootNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
import { EvaluationMap, RootSnapshot, SnapshotDiff } from '../helpers/types';
export type ExpectationRuntime = {
    tree: RootNode;
    statusMap: EvaluationMap;
    snapshot: RootSnapshot;
    diffs: SnapshotDiff[];
};
export type StateAction = {
    type: 'SET_TREE';
    tree: RootNode;
} | {
    type: 'UPDATE_STATUS_MAP';
    statusMap: EvaluationMap;
} | {
    type: 'UPDATE_NODE_STATUS';
    id: ExpectationNode['id'];
    status: NodeStatus;
};
