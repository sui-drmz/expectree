import { describe, it, expect } from 'vitest';
import { diffSnapshots } from '@/helpers/diffSnapshots';
import { EvaluationSnapshot } from '@/helpers/types';

const exp = (id: string, status: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED') =>
  ({
    type: 'EXPECTATION',
    id,
    status,
  }) as const;

const root = (child?: EvaluationSnapshot) =>
  ({ type: 'ROOT', status: child?.status ?? 'PENDING', child }) as const;

describe('diffSnapshots', () => {
  it('detects ADDED and REMOVED ids', () => {
    const prev = root(exp('a', 'PASSED')) as EvaluationSnapshot;
    const next = root(exp('b', 'FAILED')) as EvaluationSnapshot;
    const diffs = diffSnapshots(prev, next);
    expect(diffs).toContainEqual({ id: 'a', change: 'REMOVED' });
    expect(diffs).toContainEqual({ id: 'b', change: 'ADDED' });
  });

  it('detects STATUS change', () => {
    const prev = root(exp('a', 'PENDING')) as EvaluationSnapshot;
    const next = root(exp('a', 'PASSED')) as EvaluationSnapshot;
    const diffs = diffSnapshots(prev, next);
    expect(diffs).toContainEqual({
      id: 'a',
      change: 'STATUS',
      oldStatus: 'PENDING',
      newStatus: 'PASSED',
    });
  });
});
