# Expectree

Expectree is a TypeScript library for managing complex, branching state as expectation trees. You define expectations for how a scenario should unfold, and Expectree helps you run them step-by-step, inspect the state, and compare what actually happened to what you expected.

## Install

```bash
npm i @sui-drmz/expectree
```

## First Scenario

```ts
import { node, TreeBuilder } from '@sui-drmz/expectree';

// Vim tutorial: either perform the three manual edits or use the substitution macro
const moveCursor = node('vim.cursor.line5', { type: 'vim', goal: 'position' });
const deleteFoo = node('vim.delete.foo', { type: 'vim', goal: 'edit' });
const deleteBar = node('vim.delete.bar', { type: 'vim', goal: 'edit' });
const substitution = node('vim.substitute.foo-bar', {
  type: 'vim',
  goal: 'shortcut',
});

const tree = new TreeBuilder()
  .group(builder =>
    builder
      .addExpectation(moveCursor)
      .and()
      .group(b => b.addExpectation(deleteFoo).and().addExpectation(deleteBar))
  )
  .or()
  .addExpectation(substitution)
  .build();

// Learner takes the manual path
moveCursor.fulfill();
deleteFoo.fulfill();
deleteBar.fulfill();

console.log(tree.status); // "PASSED"
console.log(tree.diffs); // Snapshot of what changed for playback/analytics
```

## Core Concepts

### Expectations (Nodes)

Nodes represent observable goals. They can be fulfilled, rejected, or pending. Attach metadata (`type`, `tags`, `group`) to power selectors, analytics, and author tooling.

### Composition

Combine expectations with boolean operators:

- `and()` – all expectations inside the group must pass
- `or()` – any branch can satisfy the scenario
- `not()` – invert an expectation (use sparingly for clarity)
- `group()` – nest structure to express prerequisites and optional paths

### State & Snapshots

Trees maintain immutable state. Each change produces a new snapshot and diff list, enabling time travel, playback, and deterministic debugging.

### Reactivity

Subscribe via `tree.subscribe`, hook into React with `useExpectationTree`, or call `tree.visualize` to render ASCII/other representations for instructor consoles.

## Scenario Patterns

- **Linear with escape hatches** – sequential steps with alternative shortcuts (tutorials)
- **Fan-in quests** – multiple parallel tasks that converge (CLI or onboarding flows)
- **Guarded runbooks** – nested approvals and verification gates (operations)
- **Adaptive exams** – evaluation nodes unlock follow-up expectations based on mastery

The tests in `tests/unit` showcase these patterns in detail.

## React Example: Incident Runbook

Here’s a minimal React component that wires an incident runbook tree into your UI:

```tsx
import { useMemo } from 'react';
import { node, TreeBuilder, useExpectationTree } from '@sui-drmz/expectree';

function createRunbookTree() {
  const acknowledge = node('runbook.ack', { type: 'runbook', stage: 'ack' });
  const rollback = node('runbook.rollback', {
    type: 'runbook',
    stage: 'mitigate',
  });
  const verify = node('runbook.verify', { type: 'runbook', stage: 'verify' });
  const escalate = node('runbook.escalate', {
    type: 'runbook',
    stage: 'fallback',
  });

  return new TreeBuilder()
    .addExpectation(acknowledge)
    .and()
    .group(b => b.addExpectation(rollback).or().addExpectation(escalate))
    .and()
    .addExpectation(verify)
    .build();
}

export function IncidentRunbookPanel() {
  const tree = useMemo(() => createRunbookTree(), []);
  const { status, snapshot, diffs } = useExpectationTree(tree);

  return (
    <section>
      <h2>Runbook status: {status}</h2>
      <pre>{tree.visualize('ascii')}</pre>
      <small>
        Steps taken: {snapshot.completedCount} / {snapshot.totalCount}
      </small>
      <details>
        <summary>Last changes</summary>
        <pre>{JSON.stringify(diffs, null, 2)}</pre>
      </details>
    </section>
  );
}
```

Below are more focused examples showing how to work with nodes and trees.

### Creating Nodes

```ts
import { node, check } from '@sui-drmz/expectree';

// With alias (dot syntax)
const n1 = node('user.isAdmin', { type: 'user', role: 'admin' });

// With tags and groups
const n2 = node(
  'auth.check',
  { type: 'auth' },
  {
    tags: ['security', 'auth'],
    group: 'authentication',
  }
);

// Simple check
const n3 = check({ type: 'feature', enabled: true });
```

### Building Trees

```ts
const tree = new TreeBuilder()
  .addExpectation(node('A', { type: 'check' }))
  .and()
  .addExpectation(node('B', { type: 'check' }))
  .or()
  .group(b => b.addExpectation(node('C', { type: 'check' })).not())
  .build();
```

### Fulfilling Nodes

```ts
// Get node reference
const nodeA = tree.findOne('A'); // by alias
const nodeB = tree.findByTag('auth')[0]; // by tag
const nodeC = tree.findByGroup('user')[0]; // by group

// Fulfill nodes
nodeA.fulfill();
nodeB.reject();
nodeC.reset(); // back to pending

// Check individual node status
console.log(nodeA.isFulfilled()); // true
console.log(nodeB.isRejected()); // true
console.log(nodeC.isPending()); // true
```

### Querying Nodes

```ts
// Find by alias
const node = tree.findOne('user.isAdmin');

// Find by tag
const authNodes = tree.findByTag('auth');

// Find by group
const userNodes = tree.findByGroup('user');

// String selector syntax
tree.find('#auth'); // by tag
tree.find('@user'); // by group
tree.find('user.isAdmin'); // by alias
```

### Snapshots & Time Travel

```ts
const { snapshot, diffs, isFulfilled } = useExpectationTree(tree);

console.log(snapshot.status); // "PASSED" | "FAILED" | "PENDING"
console.log(snapshot.expectations.length); // all nodes with current statuses
console.log(diffs); // list of changes since the last snapshot

// Handy helpers for dashboards/tests
console.log(isFulfilled()); // is the whole scenario satisfied?
```

### Async & External Signals

Expectations support `fulfillAsync`, `rejectAsync`, and `evaluateAsync`, making it easy to plug in telemetry streams (e.g., command output, API checks, IDE events). Snapshots/diffs capture the resulting state transitions.

```ts
import { node } from '@sui-drmz/expectree';

const apiHealthy = node('service.apiHealthy', { type: 'healthcheck' });

// Wire in your own async logic
apiHealthy.evaluateAsync(async () => {
  const res = await fetch('/health');
  return res.ok ? 'FULFILLED' : 'REJECTED';
});
```

### Import/Export

Use `exportExpectations` and `importExpectations` to persist scenarios, share them with authoring tools, or replay sessions from logs.

```ts
import {
  exportExpectations,
  importExpectations,
  TreeBuilder,
} from '@sui-drmz/expectree';

// Serialize a tree definition (no runtime state)
const serialized = exportExpectations(tree);

// Later or elsewhere — recreate the same structure
const restoredTree = new TreeBuilder().fromSerialized(serialized).build();
```

## Philosophy

- **Scenario-first** – everything ladders up to interactive journeys.
- **Transparent state** – immutable snapshots and diffs are table stakes.
- **Extensible adapters** – domain-specific instrumentation lives outside the core.

## Contributing

Contributions are very welcome — from bug reports and small fixes to new helpers, visualizers, and example scenarios.

- Open an issue if something is confusing, missing, or broken.
- Send a PR that follows the existing code style and includes tests where it makes sense (the `tests/unit` folder has plenty of patterns to copy).
- If you’re unsure whether an idea fits, a short issue or email is perfect to start the conversation.

If you’d like to get involved but aren’t sure where to start, reach out at **suidrmz@gmail.com** and we can find a good entry point.

## Sponsorship & Support

If Expectree helps you ship better tutorials, exams, runbooks, or workflows, consider supporting its development.

- Encourage adoption inside your team or company.
- Sponsor feature work, consulting, or priority support by emailing **suidrmz@gmail.com**.

Even a short note about how you’re using the library is incredibly motivating and helps steer the roadmap.

## Real‑world Use Cases

I’d love to hear about real-world scenarios where Expectree is used — from education tools to incident dashboards and beyond.

If you have a production or experimental use case:

- Share a brief description (and anything you can show publicly) via **suidrmz@gmail.com**.
- Let me know what worked well, what was awkward, and what you wish the library did better.

These stories help shape future APIs, examples, and documentation.

## License

MIT
