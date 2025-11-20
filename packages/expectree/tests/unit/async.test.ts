import { describe, it, expect } from 'vitest';
import { TreeBuilder } from '@/tree';
import { node } from '@/builder';

describe('Async expectation support', () => {
  describe('fulfillAsync', () => {
    it('should fulfill after async operation succeeds', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      expect(nodeA.isPending()).toBe(true);

      await nodeA.fulfillAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(nodeA.isFulfilled()).toBe(true);
      expect(tree.status).toBe('PASSED');
    });

    it('should reject if async operation throws', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await expect(
        nodeA.fulfillAsync(async () => {
          throw new Error('Async failure');
        })
      ).rejects.toThrow('Async failure');

      expect(nodeA.isRejected()).toBe(true);
      expect(tree.status).toBe('FAILED');
    });

    it('should work with API calls', async () => {
      const nodeA = node('user.authenticated', { type: 'auth' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await nodeA.fulfillAsync(async () => {
        // Simulate API call
        const response = await Promise.resolve({ authenticated: true });
        if (!response.authenticated) {
          throw new Error('Not authenticated');
        }
      });

      expect(nodeA.isFulfilled()).toBe(true);
    });
  });

  describe('rejectAsync', () => {
    it('should reject after async operation completes', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await nodeA.rejectAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(nodeA.isRejected()).toBe(true);
      expect(tree.status).toBe('FAILED');
    });

    it('should reject even if async operation throws', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await expect(
        nodeA.rejectAsync(async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');

      expect(nodeA.isRejected()).toBe(true);
    });
  });

  describe('evaluateAsync', () => {
    it('should fulfill when async function returns true', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await nodeA.evaluateAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      });

      expect(nodeA.isFulfilled()).toBe(true);
      expect(tree.status).toBe('PASSED');
    });

    it('should reject when async function returns false', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await nodeA.evaluateAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return false;
      });

      expect(nodeA.isRejected()).toBe(true);
      expect(tree.status).toBe('FAILED');
    });

    it('should reject when async function throws', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      await expect(
        nodeA.evaluateAsync(async () => {
          throw new Error('Evaluation error');
        })
      ).rejects.toThrow('Evaluation error');

      expect(nodeA.isRejected()).toBe(true);
    });

    it('should work with real-world validation scenarios', async () => {
      const emailNode = node('email.valid', { type: 'validation' });
      const tree = new TreeBuilder().addExpectation(emailNode).build();

      // Simulate email validation API
      await emailNode.evaluateAsync(async () => {
        const email = 'test@example.com';
        await new Promise(resolve => setTimeout(resolve, 10));
        return email.includes('@');
      });

      expect(emailNode.isFulfilled()).toBe(true);
    });
  });

  describe('parallel async operations', () => {
    it('should handle multiple async expectations in parallel', async () => {
      const nodeA = node('A', { type: 'check' });
      const nodeB = node('B', { type: 'check' });
      const nodeC = node('C', { type: 'check' });

      const tree = new TreeBuilder()
        .addExpectation(nodeA)
        .and()
        .addExpectation(nodeB)
        .and()
        .addExpectation(nodeC)
        .build();

      await Promise.all([
        nodeA.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return true;
        }),
        nodeB.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 15));
          return true;
        }),
        nodeC.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return true;
        }),
      ]);

      expect(tree.isFulfilled()).toBe(true);
      expect(tree.status).toBe('PASSED');
    });

    it('should handle mixed success and failure', async () => {
      const nodeA = node('A', { type: 'check' });
      const nodeB = node('B', { type: 'check' });

      const tree = new TreeBuilder()
        .addExpectation(nodeA)
        .or()
        .addExpectation(nodeB)
        .build();

      await Promise.all([
        nodeA.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return true;
        }),
        nodeB.evaluateAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return false;
        }),
      ]);

      // OR: one success is enough
      expect(tree.isFulfilled()).toBe(true);
    });
  });

  describe('subscription with async operations', () => {
    it('should notify subscribers after async fulfillment', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      let notificationCount = 0;
      tree.subscribe(() => {
        notificationCount++;
      });

      await nodeA.fulfillAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(notificationCount).toBe(1);
      expect(nodeA.isFulfilled()).toBe(true);
    });

    it('should provide updated status in subscription callback', async () => {
      const nodeA = node('A', { type: 'check' });
      const tree = new TreeBuilder().addExpectation(nodeA).build();

      let capturedStatus: string | null = null;
      tree.subscribe(() => {
        capturedStatus = tree.status;
      });

      await nodeA.evaluateAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      });

      expect(capturedStatus).toBe('PASSED');
    });
  });
});
