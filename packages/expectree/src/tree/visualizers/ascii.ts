import { Node, RootNode } from '../nodes';
import type { TreeVisualizer, VisualizerRenderOptions } from './types';
import { formatNodeLabel } from './shared';

const ASCII_INDENT_WITH_BRANCH = '|  ';
const ASCII_INDENT_NO_BRANCH = '   ';

function renderChildren(
  lines: string[],
  children: readonly Node[],
  prefix: string
): void {
  children.forEach((child, index) => {
    const isLast = index === children.length - 1;
    const connector = isLast ? '\\-' : '+-';
    const line = `${prefix}${connector} ${formatNodeLabel(child)}`;
    lines.push(line);

    const nextPrefix = `${prefix}${isLast ? ASCII_INDENT_NO_BRANCH : ASCII_INDENT_WITH_BRANCH}`;
    const childChildren = child.children;
    if (childChildren.length > 0) {
      renderChildren(lines, childChildren, nextPrefix);
    }
  });
}

function renderRoot(root: RootNode): string {
  if (root.isEmpty()) {
    return 'ROOT (empty)';
  }

  const lines: string[] = [formatNodeLabel(root)];
  renderChildren(lines, root.children, '');
  return lines.join('\n');
}

export const asciiTreeVisualizer: TreeVisualizer = {
  id: 'ascii',
  label: 'ASCII',
  description: 'Plain-text tree layout using ASCII branches',
  render(root: RootNode, _options?: VisualizerRenderOptions): string {
    return renderRoot(root);
  },
};

// Useful for unit testing internal helpers
export const __private__ = {
  formatNodeLabel,
  renderRoot,
};
