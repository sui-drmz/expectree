import { describe, it, expect, vi } from 'vitest';
import { TreeBuilder } from '@/tree';
import { node } from '@/builder';

describe('RootNode subscription', () => {
  it('should notify subscribers when expectations are fulfilled', () => {
    const nodeA = node('A', { type: 'check' });
    const tree = new TreeBuilder().addExpectation(nodeA).build();

    const listener = vi.fn();
    const unsubscribe = tree.subscribe(listener);

    nodeA.fulfill();
    expect(listener).toHaveBeenCalledTimes(1);

    nodeA.reset();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('should notify subscribers when expectations are rejected', () => {
    const nodeA = node('A', { type: 'check' });
    const tree = new TreeBuilder().addExpectation(nodeA).build();

    const listener = vi.fn();
    tree.subscribe(listener);

    nodeA.reject();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple subscribers', () => {
    const nodeA = node('A', { type: 'check' });
    const tree = new TreeBuilder().addExpectation(nodeA).build();

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    tree.subscribe(listener1);
    tree.subscribe(listener2);

    nodeA.fulfill();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should stop notifying after unsubscribe', () => {
    const nodeA = node('A', { type: 'check' });
    const tree = new TreeBuilder().addExpectation(nodeA).build();

    const listener = vi.fn();
    const unsubscribe = tree.subscribe(listener);

    nodeA.fulfill();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    nodeA.reset();
    expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should notify on complex tree changes', () => {
    const nodeA = node('A', { type: 'check' });
    const nodeB = node('B', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(nodeA)
      .and()
      .addExpectation(nodeB)
      .build();

    const listener = vi.fn();
    tree.subscribe(listener);

    nodeA.fulfill();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(tree.status).toBe('PENDING'); // B still pending

    nodeB.fulfill();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(tree.status).toBe('PASSED');
  });

  it('should provide access to diffs in subscription callback', () => {
    const nodeA = node('A', { type: 'check' });
    const tree = new TreeBuilder().addExpectation(nodeA).build();

    let capturedDiffs: any[] = [];
    tree.subscribe(event => {
      capturedDiffs = event.diffs;
    });

    nodeA.fulfill();

    expect(capturedDiffs.length).toBeGreaterThan(0);
    expect(capturedDiffs.some(d => d.id === nodeA.id)).toBe(true);
  });
});
