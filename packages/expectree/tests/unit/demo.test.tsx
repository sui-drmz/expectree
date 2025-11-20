import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useMemo } from 'react';
import { TreeBuilder, node } from '@/index';
import { useExpectationTree } from '@/react/useExpectationTree';

function CheckboxDemo({
  label,
  node,
  onChange,
}: {
  label: string;
  node: ReturnType<TreeBuilder['build']>['findOne'];
  onChange?: () => void;
}) {
  if (!node) return null;

  const status = (node as any).status;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      (node as any).fulfill();
    } else {
      (node as any).reset();
    }
    onChange?.();
  };

  return (
    <div data-testid={`checkbox-${label}`}>
      <input
        type="checkbox"
        id={label}
        checked={status === 'PASSED'}
        onChange={handleChange}
      />
      <label htmlFor={label}>{label}</label>
      <span data-testid={`status-${label}`}>{status}</span>
    </div>
  );
}

describe('Demo Examples', () => {
  describe('Example 1: Simple AND Logic', () => {
    it('should pass when both A and B are checked', async () => {
      function TestComponent() {
        const [, forceUpdate] = useState(0);

        const tree = useMemo(() => {
          const nodeA = node('A', { type: 'check' });
          const nodeB = node('B', { type: 'check' });
          return new TreeBuilder()
            .addExpectation(nodeA)
            .and()
            .addExpectation(nodeB)
            .build();
        }, []);

        const { status, isFulfilled } = useExpectationTree(tree);
        const nodeA = tree.findOne('A');
        const nodeB = tree.findOne('B');

        const triggerUpdate = () => forceUpdate(prev => prev + 1);

        return (
          <div>
            <div data-testid="status">{status}</div>
            <div data-testid="fulfilled">{isFulfilled() ? 'yes' : 'no'}</div>
            <CheckboxDemo label="A" node={nodeA} onChange={triggerUpdate} />
            <CheckboxDemo label="B" node={nodeB} onChange={triggerUpdate} />
          </div>
        );
      }

      render(<TestComponent />);
      const user = userEvent.setup();

      expect(screen.getByTestId('status').textContent).toBe('PENDING');

      await user.click(screen.getByLabelText('A'));
      await waitFor(() => {
        expect(screen.getByTestId('status-' + 'A').textContent).toBe('PASSED');
      });
      expect(screen.getByTestId('status').textContent).toBe('PENDING');

      await user.click(screen.getByLabelText('B'));
      await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('PASSED');
        expect(screen.getByTestId('fulfilled').textContent).toBe('yes');
      });
    });
  });
});
