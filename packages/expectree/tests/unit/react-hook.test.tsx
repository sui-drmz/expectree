import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpectations } from '@/react/useExpectations';
import { ExpectationNode, RootNode } from '@/tree/nodes';

const leaf = (id: string) => new ExpectationNode(id, { type: 't' });

describe('useExpectations', () => {
  it('computes snapshot and diffs when inputs change', async () => {
    const tree = new RootNode(leaf('a'));
    const status = new Map<string, any>([['a', 'PENDING']]);

    const { result, rerender } = renderHook(
      ({ t, s }) => useExpectations(t, s),
      {
        initialProps: { t: tree, s: status },
      }
    );

    expect(result.current.rootStatus).toBe('PENDING');

    const nextStatus = new Map(status);
    nextStatus.set('a', 'PASSED');
    await act(async () => {
      rerender({ t: tree, s: nextStatus });
    });

    expect(result.current.rootStatus).toBe('PASSED');
    expect(
      result.current.diffs.some(d => d.id === 'a' && d.change === 'STATUS')
    ).toBe(true);
  });
});
