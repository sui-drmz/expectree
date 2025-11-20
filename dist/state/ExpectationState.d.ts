import { ExpectationRuntime, StateAction } from './types';
import { EvaluationSnapshot, SnapshotDiff } from '../helpers/types';
import { RootNode } from '../tree/nodes';
import { NodeStatus } from '../tree/types';
type Listener = () => void;
export declare class ExpectationState {
    private state;
    private listeners;
    constructor();
    /**
     * Dispatches an action and triggers re-evaluation and subscribers if the state changes.
     */
    dispatch(action: StateAction): void;
    /**
     * Subscribes to state updates. Returns a cleanup function.
     *
     * @param fn - The function to call when the state changes.
     * @returns A cleanup function.
     */
    subscribe(fn: Listener): () => void;
    /**
     * Current tree, snapshot, status map, and diffs
     */
    get tree(): RootNode;
    get statusMap(): Map<string, NodeStatus>;
    get snapshot(): EvaluationSnapshot;
    get diffs(): SnapshotDiff[];
    /**
     * Returns the entire internal state.
     */
    getState(): ExpectationRuntime;
    /**
     * Notifies all subscribers.
     */
    private notify;
}
export {};
