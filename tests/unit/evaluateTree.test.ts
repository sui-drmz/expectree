import { describe, it, expect } from 'vitest';
import {
  AndNode,
  ExpectationNode,
  NotNode,
  OrNode,
  RootNode,
  GroupNode,
} from '@/tree/nodes';
import { evaluateTree } from '@/helpers/evaluateTree';
import { NodeStatus } from '@/tree/types';

const leaf = (id: string) => new ExpectationNode(id, { type: 't' });

const map = (entries: [string, NodeStatus][]) => new Map(entries);

describe('evaluateTree', () => {
  it('returns PENDING for empty root', () => {
    const root = new RootNode();
    const result = evaluateTree(root, new Map());
    expect(result.status).toBe('PENDING');
  });

  it('evaluates single expectation from statusMap', () => {
    const root = new RootNode(leaf('a'));
    const snapshot = evaluateTree(root, map([['a', 'PASSED']]));
    expect(snapshot.child?.type).toBe('EXPECTATION');
    expect(snapshot.status).toBe('PASSED');
  });

  it('AND short-circuits on left FAILED and skips right subtree', () => {
    const root = new RootNode(
      new AndNode(leaf('a'), new AndNode(leaf('b'), leaf('c')))
    );
    const snap = evaluateTree(
      root,
      map([
        ['a', 'FAILED'],
        ['b', 'PASSED'],
        ['c', 'PASSED'],
      ])
    );
    const and = snap.child as any;
    expect(and.type).toBe('AND');
    expect(and.status).toBe('FAILED');
    expect(and.right.status).toBe('SKIPPED');
    expect(and.right.left.status).toBe('SKIPPED');
    expect(and.right.right.status).toBe('SKIPPED');
  });

  it('OR short-circuits on left PASSED and skips right', () => {
    const root = new RootNode(new OrNode(leaf('a'), leaf('b')));
    const snap = evaluateTree(
      root,
      map([
        ['a', 'PASSED'],
        ['b', 'FAILED'],
      ])
    );
    const or = snap.child as any;
    expect(or.type).toBe('OR');
    expect(or.status).toBe('PASSED');
    expect(or.right.status).toBe('SKIPPED');
  });

  it('NOT negates PASSED/FAILED, keeps others', () => {
    const root = new RootNode(new NotNode(leaf('a')));
    const snapPass = evaluateTree(root, map([['a', 'PASSED']]));
    const snapFail = evaluateTree(root, map([['a', 'FAILED']]));
    const snapPending = evaluateTree(root, map([['a', 'PENDING']]));
    expect(snapPass.status).toBe('FAILED');
    expect(snapFail.status).toBe('PASSED');
    expect(snapPending.status).toBe('PENDING');
  });

  it('GROUP mirrors child status', () => {
    const root = new RootNode(new GroupNode(leaf('a')));
    const snap = evaluateTree(root, map([['a', 'FAILED']]));
    expect(snap.child?.type).toBe('GROUP');
    expect((snap.child as any).child.status).toBe('FAILED');
    expect(snap.status).toBe('FAILED');
  });
});
