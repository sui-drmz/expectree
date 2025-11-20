import { describe, it, expect } from 'vitest';
import { TreeBuilder } from '@/tree/TreeBuilder';
import { node } from '@/builder';
// Import query methods
import '@/tree/query';

describe('Stateful Node API', () => {
  it('allows fulfilling nodes with sweet API', () => {
    const nodeA = node('A', { type: 'check' });
    const nodeB = node('B', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(nodeA)
      .and()
      .addExpectation(nodeB)
      .build();

    // Initially pending
    expect(tree.status).toBe('PENDING');
    expect(nodeA.isPending()).toBe(true);
    expect(nodeB.isPending()).toBe(true);

    // Fulfill first node
    nodeA.fulfill();
    expect(nodeA.isFulfilled()).toBe(true);
    expect(tree.status).toBe('PENDING'); // Still pending (B not fulfilled)

    // Fulfill second node
    nodeB.fulfill();
    expect(nodeB.isFulfilled()).toBe(true);
    expect(tree.status).toBe('PASSED'); // Now passed!
    expect(tree.isFulfilled()).toBe(true);
  });

  it('handles rejection', () => {
    const nodeA = node('A', { type: 'check' });
    const nodeB = node('B', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(nodeA)
      .and()
      .addExpectation(nodeB)
      .build();

    nodeA.fulfill();
    nodeB.reject();

    expect(nodeB.isRejected()).toBe(true);
    expect(tree.status).toBe('FAILED');
    expect(tree.isRejected()).toBe(true);
  });

  it('does not emit duplicate updates when status is unchanged', () => {
    const expectation = node('A', { type: 'check' });

    const tree = new TreeBuilder().addExpectation(expectation).build();

    let notifications = 0;
    tree.subscribe(() => {
      notifications += 1;
    });

    expectation.fulfill();
    const firstState = tree.treeState;

    expectation.fulfill();
    const secondState = tree.treeState;

    expect(tree.isFulfilled()).toBe(true);
    expect(notifications).toBe(1);
    expect(secondState).toBe(firstState);
  });

  it('can reset nodes', () => {
    const nodeA = node('A', { type: 'check' });

    const tree = new TreeBuilder().addExpectation(nodeA).build();

    nodeA.fulfill();
    expect(nodeA.isFulfilled()).toBe(true);

    nodeA.reset();
    expect(nodeA.isPending()).toBe(true);
    expect(tree.status).toBe('PENDING');
  });

  it('supports querying by alias', () => {
    const tree = new TreeBuilder()
      .addExpectation(node('user.isAdmin', { type: 'user' }))
      .and()
      .addExpectation(node('feature.enabled', { type: 'feature' }))
      .build();

    const userNode = tree.findOne('user.isAdmin');
    const featureNode = tree.findOne('feature.enabled');

    expect(userNode).toBeDefined();
    expect(featureNode).toBeDefined();

    userNode!.fulfill();
    featureNode!.fulfill();

    expect(tree.isFulfilled()).toBe(true);
  });

  it('supports nested alias paths through group aliases', () => {
    const tree = new TreeBuilder()
      .group(b => b.addExpectation(node('isLoggedIn', { type: 'auth' })), {
        alias: 'User',
      })
      .build();

    const nested = tree.findOne('User.isLoggedIn');
    const direct = tree.findOne('isLoggedIn');

    expect(nested).toBeDefined();
    expect(direct).toBeDefined();
    expect(nested).toBe(direct);
  });

  it('supports querying by tag', () => {
    const tree = new TreeBuilder()
      .addExpectation(
        node('auth.login', { type: 'auth' }, { tags: ['auth', 'security'] })
      )
      .and()
      .addExpectation(
        node(
          'auth.permission',
          { type: 'auth' },
          { tags: ['auth', 'security'] }
        )
      )
      .build();

    const authNodes = tree.findByTag('auth');
    expect(authNodes).toHaveLength(2);

    authNodes.forEach(n => n.fulfill());
    expect(tree.isFulfilled()).toBe(true);
  });

  it('supports querying by group', () => {
    const tree = new TreeBuilder()
      .addExpectation(node('user.isAdmin', { type: 'user' }, { group: 'user' }))
      .and()
      .addExpectation(
        node('user.hasPermission', { type: 'user' }, { group: 'user' })
      )
      .build();

    const userNodes = tree.findByGroup('user');
    expect(userNodes).toHaveLength(2);

    userNodes.forEach(n => n.fulfill());
    expect(tree.isFulfilled()).toBe(true);
  });

  it('tracks diffs between states', () => {
    const nodeA = node('A', { type: 'check' });

    const tree = new TreeBuilder().addExpectation(nodeA).build();

    nodeA.fulfill();

    const diffs = tree.diffs;
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs.some(d => d.id === nodeA.id)).toBe(true);
  });

  it('provides snapshots', () => {
    const nodeA = node('A', { type: 'check' });

    const tree = new TreeBuilder().addExpectation(nodeA).build();

    const snapshot1 = tree.snapshot;
    expect(snapshot1.status).toBe('PENDING');

    nodeA.fulfill();

    const snapshot2 = tree.snapshot;
    expect(snapshot2.status).toBe('PASSED');
  });

  it('handles OR logic', () => {
    const nodeA = node('A', { type: 'check' });
    const nodeB = node('B', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(nodeA)
      .or()
      .addExpectation(nodeB)
      .build();

    // Fulfill just one
    nodeA.fulfill();

    expect(tree.status).toBe('PASSED'); // OR passes with one fulfilled
  });

  it('handles NOT logic', () => {
    const nodeA = node('A', { type: 'check' });

    const tree = new TreeBuilder().addExpectation(nodeA).not().build();

    // Initially pending
    expect(tree.status).toBe('PENDING');

    // Reject the node (NOT rejected = passed)
    nodeA.reject();
    expect(tree.status).toBe('PASSED');

    // Fulfill the node (NOT fulfilled = failed)
    nodeA.reset();
    nodeA.fulfill();
    expect(tree.status).toBe('FAILED');
  });

  it('handles grouped expressions', () => {
    const nodeA = node('A', { type: 'check' });
    const nodeB = node('B', { type: 'check' });
    const nodeC = node('C', { type: 'check' });

    // (A AND B) OR C
    const tree = new TreeBuilder()
      .group(b => b.addExpectation(nodeA).and().addExpectation(nodeB))
      .or()
      .addExpectation(nodeC)
      .build();

    // Fulfill just C
    nodeC.fulfill();
    expect(tree.status).toBe('PASSED');

    // Reset and try the other path
    nodeC.reset();
    nodeA.fulfill();
    nodeB.fulfill();
    expect(tree.status).toBe('PASSED');
  });
});
