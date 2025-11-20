import { describe, it, expect } from 'vitest';
import {
  TreeBuilder,
  node,
  exportExpectations,
  importExpectations,
} from '@/index';

describe('expectation serialization', () => {
  it('exports and imports expectation trees with statuses', () => {
    const admin = node('user.isAdmin', { type: 'check' });
    const feature = node('feature.enabled', { type: 'check' });

    const tree = new TreeBuilder()
      .addExpectation(admin)
      .and()
      .addExpectation(feature)
      .build();

    admin.fulfill();

    const document = exportExpectations(tree, { includeStatuses: true });
    const restored = importExpectations(document);

    const restoredAdmin = restored.findOne('user.isAdmin');
    const restoredFeature = restored.findOne('feature.enabled');

    expect(restoredAdmin?.isFulfilled()).toBe(true);
    expect(restoredFeature?.isPending()).toBe(true);
    expect(restored.status).toBe('PENDING');
  });

  it('supports importing without attaching state', () => {
    const tree = new TreeBuilder()
      .addExpectation(node('check', { type: 'check' }))
      .build();

    const document = exportExpectations(tree);
    const restored = importExpectations(document, { attachState: false });

    expect(restored.hasState()).toBe(false);
    expect(restored.child?.type).toBe('EXPECTATION');
  });

  it('rebinds an external tree state when initializing a new root', () => {
    const admin = node('user.isAdmin', { type: 'check' });
    const feature = node('feature.enabled', { type: 'check' });

    const original = new TreeBuilder()
      .addExpectation(admin)
      .and()
      .addExpectation(feature)
      .build();

    admin.fulfill();

    const state = original.treeState;
    const document = exportExpectations(original, { includeStatuses: true });

    const restored = importExpectations(document, { attachState: false });
    expect(restored.hasState()).toBe(false);

    restored.initializeState(state);

    const restoredAdmin = restored.findOne('user.isAdmin');
    const restoredFeature = restored.findOne('feature.enabled');

    expect(restored.treeState).not.toBe(state);
    expect(restoredAdmin?.isFulfilled()).toBe(true);
    expect(restoredFeature?.isPending()).toBe(true);
    expect(restored.status).toBe('PENDING');
    expect(state.tree).toBe(original);
  });
});
