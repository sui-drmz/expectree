import { afterEach, describe, expect, it } from 'vitest';

import { ExpectationNode, GroupNode, RootNode } from '@/tree/nodes';
import {
  getVisualizer,
  listVisualizers,
  registerVisualizer,
  unregisterVisualizer,
  visualizeTree,
} from '@/tree/visualizers';

const createSampleTree = () => {
  const expectation = new ExpectationNode('alpha', { type: 'demo' });
  return new RootNode(expectation);
};

describe('tree visualizers', () => {
  afterEach(() => {
    try {
      unregisterVisualizer('test-visualizer');
    } catch (_error) {
      // Swallow errors when the test did not register the visualizer.
    }
  });

  it('renders using the default ASCII visualizer', () => {
    const root = createSampleTree();
    const output = visualizeTree(root);

    expect(output).toContain('ROOT');
    expect(output).toContain('EXPECTATION');
    expect(output).toContain('alpha');
  });

  it('exposes the HTML visualizer by default', () => {
    expect(listVisualizers().some(visualizer => visualizer.id === 'html')).toBe(
      true
    );

    expect(getVisualizer('html').id).toBe('html');
  });

  it('renders collapsible HTML markup when requested', () => {
    const root = createSampleTree();

    const output = root.visualize({ visualizer: 'html' });

    expect(output).toContain('<style>');
    expect(output).toContain('<details');
    expect(output).toContain('<summary>');
    expect(output).toContain('data-node-type="EXPECTATION"');
    expect(output).toContain('EXPECTATION (alpha | type=demo)');
  });

  it('supports collapsing branches by default', () => {
    const expectation = new ExpectationNode('alpha', { type: 'demo' });
    const group = new GroupNode(expectation, 'demo.group');
    const root = new RootNode(group);

    const output = root.visualize({
      visualizer: 'html',
      renderOptions: {
        defaultCollapsed: true,
        collapseRoot: true,
        includeStyles: false,
      },
    });

    expect(output).not.toContain('<style>');

    const detailTags = output.match(/<details[^>]*>/g) ?? [];
    expect(detailTags.length).toBeGreaterThan(0);
    detailTags.forEach(tag => {
      expect(tag.includes('open')).toBe(false);
    });
  });

  it('allows custom visualizers to be registered and used', () => {
    const root = createSampleTree();
    const customVisualizer = {
      id: 'test-visualizer',
      label: 'Test Visualizer',
      render: () => 'custom-output',
    } as const;

    registerVisualizer(customVisualizer);

    expect(
      listVisualizers().some(visualizer => visualizer.id === 'test-visualizer')
    ).toBe(true);
    expect(root.visualize({ visualizer: 'test-visualizer' })).toBe(
      'custom-output'
    );
  });

  it('throws when an unknown visualizer id is requested', () => {
    const root = createSampleTree();

    expect(() => root.visualize({ visualizer: 'missing' })).toThrow(
      'Tree visualizer "missing" is not registered.'
    );
  });
});
