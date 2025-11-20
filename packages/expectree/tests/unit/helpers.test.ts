import { describe, it, expect } from 'vitest';
import { RootNode, AndNode, ExpectationNode, NotNode } from '@/tree/nodes';
import { walkTree } from '@/helpers/walkTree';
import { flattenTree } from '@/helpers/flattenTree';
import { evaluateTree } from '@/helpers/evaluateTree';
import { flattenSnapshot } from '@/helpers/flattenSnapshotTree';
import { walkSnapshotTree } from '@/helpers/walkSnapshotTree';

const leaf = (id: string) => new ExpectationNode(id, { type: 't' });

describe('helpers: walk/flatten trees and snapshots', () => {
  it('walkTree visits all nodes with correct path', () => {
    const root = new RootNode(new AndNode(leaf('a'), new NotNode(leaf('b'))));
    const seen: string[] = [];
    walkTree(root, (node, path) => {
      seen.push(`${node.type}:${path.map(p => p.type).join('>')}`);
    });
    expect(seen[0].startsWith('ROOT:')).toBe(true);
    expect(seen.some(s => s.startsWith('AND:'))).toBe(true);
    expect(seen.some(s => s.startsWith('EXPECTATION:'))).toBe(true);
  });

  it('flattenTree collects only expectation leaves', () => {
    const root = new RootNode(new AndNode(leaf('a'), new NotNode(leaf('b'))));
    const map = flattenTree(root);
    expect([...map.keys()].sort()).toEqual(['a', 'b']);
  });

  it('flattenSnapshot collects expectation snapshots', () => {
    const root = new RootNode(new AndNode(leaf('a'), leaf('b')));
    const snapshot = evaluateTree(
      root,
      new Map([
        ['a', 'PASSED'],
        ['b', 'FAILED'],
      ])
    );
    const flat = flattenSnapshot(snapshot);
    expect([...flat.keys()].sort()).toEqual(['a', 'b']);
  });

  it('walkSnapshotTree visits nodes in pre-order', () => {
    const root = new RootNode(new AndNode(leaf('a'), leaf('b')));
    const snapshot = evaluateTree(
      root,
      new Map([
        ['a', 'PASSED'],
        ['b', 'FAILED'],
      ])
    );
    const order: string[] = [];
    walkSnapshotTree(snapshot, node => order.push(node.type));
    expect(order[0]).toBe('ROOT');
    expect(order.slice(1)).toEqual(['AND', 'EXPECTATION', 'EXPECTATION']);
  });
});
