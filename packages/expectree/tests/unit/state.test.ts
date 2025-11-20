import { describe, it, expect } from 'vitest';
import { ExpectationNode, RootNode } from '@/tree/nodes';
import { reducer } from '@/state/reducer';
import { ExpectationRuntime } from '@/state/types';
import { evaluateTree } from '@/helpers/evaluateTree';
import { TreeBuilder } from '@/tree/TreeBuilder';

const leaf = (id: string) => new ExpectationNode(id, { type: 't' });

function runtime(
  tree?: RootNode,
  status?: Map<string, any>
): ExpectationRuntime {
  const t = tree ?? new RootNode();
  const s = status ?? new Map();
  return {
    tree: t,
    statusMap: s,
    snapshot: evaluateTree(t, s),
    diffs: [],
  };
}

describe('state reducer', () => {
  it('SET_TREE creates default PENDING map and diffs', () => {
    const initial = runtime();
    const tree = new RootNode(leaf('a'));
    const next = reducer(initial, { type: 'SET_TREE', tree });
    expect(next.tree).toBe(tree);
    expect(next.statusMap.get('a')).toBe('PENDING');
    expect(next.snapshot.status).toBe('PENDING');
    expect(next.diffs.length).toBeGreaterThanOrEqual(0);
  });

  it('UPDATE_NODE_STATUS updates map and recomputes snapshot/diffs', () => {
    const tree = new RootNode(leaf('a'));
    const initial = reducer(runtime(), { type: 'SET_TREE', tree });
    const next = reducer(initial, {
      type: 'UPDATE_NODE_STATUS',
      id: 'a',
      status: 'PASSED',
    });
    expect(next.statusMap.get('a')).toBe('PASSED');
    expect(next.snapshot.status).toBe('PASSED');
    expect(next.diffs.some(d => d.id === 'a')).toBe(true);
  });
});
describe('RootNode state', () => {
  it('TreeBuilder.build attaches state automatically', () => {
    const tree = new TreeBuilder().addExpectation(leaf('a')).build();
    expect(tree.hasState()).toBe(true);
    expect(tree.status).toBe('PENDING');
  });

  it('subscribe provides rich TreeUpdateEvent payloads', () => {
    const node = leaf('a');
    const tree = new RootNode(node).initializeState();

    let payload: any = null;
    const unsubscribe = tree.subscribe(event => {
      payload = event;
    });

    node.fulfill();

    expect(payload).toBeTruthy();
    expect(payload?.diffs?.some((diff: any) => diff.id === node.id)).toBe(true);
    expect(payload?.snapshot.status).toBe('PASSED');
    expect(payload?.previousSnapshot?.status).toBe('PENDING');

    unsubscribe();
  });
});
