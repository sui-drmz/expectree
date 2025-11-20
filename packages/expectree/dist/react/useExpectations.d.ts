import { RootNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
export declare function useExpectations(tree: RootNode, statusMap: Map<string, NodeStatus>): {
    snapshot: import("..").RootSnapshot;
    rootStatus: NodeStatus;
    diffs: import("..").SnapshotDiff[];
};
