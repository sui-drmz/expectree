import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React, { useMemo } from 'react';
import { TreeBuilder } from '@/tree';
import { node } from '@/builder';
import { useExpectationTree } from '@/react/useExpectationTree';

describe('useExpectationTree hook', () => {
  afterEach(() => {
    cleanup();
  });

  it('should re-render when expectations change', async () => {
    function TestComponent() {
      const tree = useMemo(() => {
        const nodeA = node('A', { type: 'check' });
        return new TreeBuilder().addExpectation(nodeA).build();
      }, []);

      const { status } = useExpectationTree(tree);
      const nodeA = tree.findOne('A');

      return (
        <div>
          <div data-testid="status">{status}</div>
          <button onClick={() => nodeA?.fulfill()}>Fulfill</button>
        </div>
      );
    }

    render(<TestComponent />);
    const user = userEvent.setup();

    expect(screen.getByTestId('status').textContent).toBe('PENDING');

    await user.click(screen.getByText('Fulfill'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PASSED');
    });
  });

  it('should track diffs across changes', async () => {
    function TestComponent() {
      const tree = useMemo(() => {
        const nodeA = node('A', { type: 'check' });
        return new TreeBuilder().addExpectation(nodeA).build();
      }, []);

      const { diffs } = useExpectationTree(tree);
      const nodeA = tree.findOne('A');

      return (
        <div>
          <div data-testid="diff-count">{diffs.length}</div>
          <button onClick={() => nodeA?.fulfill()}>Fulfill</button>
        </div>
      );
    }

    render(<TestComponent />);
    const user = userEvent.setup();

    expect(screen.getByTestId('diff-count').textContent).toBe('0');

    await user.click(screen.getByText('Fulfill'));

    await waitFor(() => {
      const diffCount = parseInt(
        screen.getByTestId('diff-count').textContent || '0'
      );
      expect(diffCount).toBeGreaterThan(0);
    });
  });

  it('should handle complex tree updates', async () => {
    function TestComponent() {
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

      return (
        <div>
          <div data-testid="status">{status}</div>
          <div data-testid="fulfilled">{isFulfilled() ? 'yes' : 'no'}</div>
          <button onClick={() => nodeA?.fulfill()}>Fulfill A</button>
          <button onClick={() => nodeB?.fulfill()}>Fulfill B</button>
        </div>
      );
    }

    render(<TestComponent />);
    const user = userEvent.setup();

    expect(screen.getByTestId('status').textContent).toBe('PENDING');
    expect(screen.getByTestId('fulfilled').textContent).toBe('no');

    await user.click(screen.getByText('Fulfill A'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PENDING');
    });

    await user.click(screen.getByText('Fulfill B'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('PASSED');
      expect(screen.getByTestId('fulfilled').textContent).toBe('yes');
    });
  });

  it('should work with async operations', async () => {
    function TestComponent() {
      const tree = useMemo(() => {
        const nodeA = node('A', { type: 'check' });
        return new TreeBuilder().addExpectation(nodeA).build();
      }, []);

      const { status } = useExpectationTree(tree);
      const nodeA = tree.findOne('A');

      const handleAsyncFulfill = async () => {
        await nodeA?.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return true;
        });
      };

      return (
        <div>
          <div data-testid="status">{status}</div>
          <button onClick={handleAsyncFulfill}>Async Fulfill</button>
        </div>
      );
    }

    render(<TestComponent />);
    const user = userEvent.setup();

    expect(screen.getByTestId('status').textContent).toBe('PENDING');

    await user.click(screen.getByText('Async Fulfill'));

    await waitFor(
      () => {
        expect(screen.getByTestId('status').textContent).toBe('PASSED');
      },
      { timeout: 200 }
    );
  });

  it('should handle rejection', async () => {
    function TestComponent() {
      const tree = useMemo(() => {
        const nodeA = node('A', { type: 'check' });
        return new TreeBuilder().addExpectation(nodeA).build();
      }, []);

      const { status, isRejected } = useExpectationTree(tree);
      const nodeA = tree.findOne('A');

      return (
        <div>
          <div data-testid="status">{status}</div>
          <div data-testid="rejected">{isRejected() ? 'yes' : 'no'}</div>
          <button onClick={() => nodeA?.reject()}>Reject</button>
        </div>
      );
    }

    render(<TestComponent />);
    const user = userEvent.setup();

    expect(screen.getByTestId('rejected').textContent).toBe('no');

    await user.click(screen.getByText('Reject'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('FAILED');
      expect(screen.getByTestId('rejected').textContent).toBe('yes');
    });
  });
});
