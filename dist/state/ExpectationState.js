import { reducer } from './reducer';
import { evaluateTree } from '../helpers/evaluateTree';
import { RootNode } from '../tree/nodes';
export class ExpectationState {
    state;
    listeners = new Set();
    constructor() {
        const initialTree = new RootNode();
        const snapshot = evaluateTree(initialTree, new Map());
        this.state = {
            tree: initialTree,
            statusMap: new Map(),
            snapshot,
            diffs: [],
        };
    }
    /**
     * Dispatches an action and triggers re-evaluation and subscribers if the state changes.
     */
    dispatch(action) {
        const next = reducer(this.state, action);
        if (next !== this.state) {
            this.state = next;
            this.notify();
        }
    }
    /**
     * Subscribes to state updates. Returns a cleanup function.
     *
     * @param fn - The function to call when the state changes.
     * @returns A cleanup function.
     */
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    /**
     * Current tree, snapshot, status map, and diffs
     */
    get tree() {
        return this.state.tree;
    }
    get statusMap() {
        return new Map(this.state.statusMap);
    }
    get snapshot() {
        return this.state.snapshot;
    }
    get diffs() {
        return [...this.state.diffs];
    }
    /**
     * Returns the entire internal state.
     */
    getState() {
        return {
            tree: this.state.tree,
            statusMap: new Map(this.state.statusMap),
            snapshot: this.state.snapshot,
            diffs: [...this.state.diffs],
        };
    }
    /**
     * Notifies all subscribers.
     */
    notify() {
        for (const fn of this.listeners)
            fn();
    }
}
