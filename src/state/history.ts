import { TreeState, TreeStateSnapshot } from './TreeState';

export interface History<TSnapshot> {
  readonly past: readonly TSnapshot[];
  readonly future: readonly TSnapshot[];
}

export type HistoryWithState = {
  readonly history: History<TreeStateSnapshot>;
  readonly state: TreeState;
};

export function createHistory(initial: TreeState): History<TreeStateSnapshot> {
  return {
    past: [initial.toSnapshot()],
    future: [],
  };
}

export function record(
  history: History<TreeStateSnapshot>,
  state: TreeState
): History<TreeStateSnapshot> {
  const nextSnapshot = state.toSnapshot();

  return {
    past: [...history.past, nextSnapshot],
    future: [],
  };
}

export function canUndo(history: History<TreeStateSnapshot>): boolean {
  return history.past.length > 1;
}

export function canRedo(history: History<TreeStateSnapshot>): boolean {
  return history.future.length > 0;
}

export function undo(
  history: History<TreeStateSnapshot>
): HistoryWithState | null {
  if (!canUndo(history)) {
    return null;
  }

  const past = history.past.slice();
  const current = past.pop() as TreeStateSnapshot;
  const previous = past[past.length - 1];

  return {
    history: {
      past,
      future: [current, ...history.future],
    },
    state: TreeState.fromSnapshot(previous),
  };
}

export function redo(
  history: History<TreeStateSnapshot>
): HistoryWithState | null {
  if (!canRedo(history)) {
    return null;
  }

  const [next, ...rest] = history.future;

  return {
    history: {
      past: [...history.past, next],
      future: rest,
    },
    state: TreeState.fromSnapshot(next),
  };
}


