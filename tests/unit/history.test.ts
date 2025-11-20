import { describe, it, expect } from 'vitest';
import { TreeBuilder } from '@/tree/TreeBuilder';
import { node } from '@/builder';
import { TreeState } from '@/state/TreeState';
import {
  createHistory,
  record,
  undo,
  redo,
  canUndo,
  canRedo,
} from '@/state/history';

describe('History helper', () => {
  const buildState = () => {
    const n1 = node('A', { type: 'check' });
    const n2 = node('B', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(n1)
      .or()
      .addExpectation(n2)
      .build();

    const state = tree.treeState as TreeState;

    return { tree, n1, n2, state };
  };

  it('creates history seeded with initial state', () => {
    const { state } = buildState();
    const history = createHistory(state);

    expect(history.past.length).toBe(1);
    expect(history.future.length).toBe(0);
  });

  it('records new states and clears future', () => {
    const { tree, n1 } = buildState();

    let history = createHistory(tree.treeState as TreeState);
    n1.fulfill();

    history = record(history, tree.treeState as TreeState);

    expect(history.past.length).toBe(2);
    expect(history.future.length).toBe(0);
  });

  it('supports undo and redo cycles', () => {
    const { tree, n1 } = buildState();

    let history = createHistory(tree.treeState as TreeState);

    n1.fulfill();
    history = record(history, tree.treeState as TreeState);

    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);

    const undoResult = undo(history);
    expect(undoResult).not.toBeNull();
    if (!undoResult) {
      return;
    }

    history = undoResult.history;
    const undoneState = undoResult.state;

    expect(undoneState.snapshot.status).toBe('PENDING');
    expect(canRedo(history)).toBe(true);

    const redoResult = redo(history);
    expect(redoResult).not.toBeNull();
    if (!redoResult) {
      return;
    }

    history = redoResult.history;
    const redoneState = redoResult.state;

    expect(redoneState.snapshot.status).toBe('PASSED');
  });
});
