import { ExpectationNode, GroupNode, Node, RootNode } from '../nodes';
import type { TreeVisualizer, VisualizerRenderOptions } from './types';
import { formatNodeLabel, getNodeStatus } from './shared';

export type HtmlVisualizerOptions = VisualizerRenderOptions & {
  /** Collapse all branches by default (except the root unless collapseRoot is true) */
  defaultCollapsed?: boolean;
  /** Whether the root branch should also start collapsed when defaultCollapsed is true */
  collapseRoot?: boolean;
  /** Inline the default styles used for the visualizer */
  includeStyles?: boolean;
  /** Additional class name(s) applied to the root container */
  className?: string;
};

interface NormalizedHtmlOptions {
  defaultCollapsed: boolean;
  collapseRoot: boolean;
  includeStyles: boolean;
  className?: string;
}

const DEFAULT_STYLES = `
.expectree-html-tree {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  color: #111827;
  font-size: 0.95rem;
}

.expectree-html-tree details,
.expectree-html-tree .expectree-node {
  margin: 0.35rem 0;
}

.expectree-html-tree summary {
  cursor: pointer;
  list-style: none;
}

.expectree-html-tree summary::-webkit-details-marker {
  display: none;
}

.expectree-html-tree .expectree-node {
  display: block;
  position: relative;
}

.expectree-html-tree .expectree-node-label {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}

.expectree-html-tree .expectree-node-label strong {
  font-weight: 600;
}

.expectree-html-tree .expectree-children {
  margin-left: 1rem;
  border-left: 1px solid #d1d5db;
  padding-left: 0.75rem;
}

.expectree-html-tree .expectree-node--leaf {
  margin-left: 1.5rem;
}

.expectree-html-tree .expectree-node--leaf::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 0.75rem;
  width: 0.75rem;
  height: 0;
  border-top: 1px solid #d1d5db;
}

.expectree-html-tree .expectree-node--root {
  margin-left: 0;
}

.expectree-html-tree .expectree-node--empty {
  font-style: italic;
  color: #6b7280;
}
`;

export const htmlTreeVisualizer: TreeVisualizer = {
  id: 'html',
  label: 'HTML',
  description: 'Semantic HTML tree with collapsible branches',
  render(root: RootNode, options?: VisualizerRenderOptions): string {
    const normalized = normalizeOptions(
      options as HtmlVisualizerOptions | undefined
    );
    return renderTree(root, normalized);
  },
};

function normalizeOptions(
  options?: HtmlVisualizerOptions
): NormalizedHtmlOptions {
  if (!options) {
    return {
      defaultCollapsed: false,
      collapseRoot: false,
      includeStyles: true,
    };
  }

  const className =
    typeof options.className === 'string' && options.className.trim().length > 0
      ? options.className.trim()
      : undefined;

  return {
    defaultCollapsed: Boolean(options.defaultCollapsed),
    collapseRoot: options.collapseRoot ?? false,
    includeStyles: options.includeStyles ?? true,
    className,
  };
}

function renderTree(root: RootNode, options: NormalizedHtmlOptions): string {
  const containerClass = ['expectree-html-tree'];
  if (options.className) {
    containerClass.push(options.className);
  }

  const content = root.isEmpty()
    ? renderEmptyState()
    : renderNode(root, options, 0);

  const parts: string[] = [];
  if (options.includeStyles) {
    parts.push(`<style>${DEFAULT_STYLES}</style>`);
  }
  parts.push(
    `<div class="${containerClass.join(' ')}" data-visualizer="html">`,
    content,
    '</div>'
  );

  return parts.join('\n');
}

function renderEmptyState(): string {
  return `
<div class="expectree-node expectree-node--root expectree-node--empty" data-node-type="ROOT">
  <span class="expectree-node-label">ROOT (empty)</span>
</div>
`.trim();
}

function renderNode(
  node: Node,
  options: NormalizedHtmlOptions,
  depth: number
): string {
  const label = escapeHtml(formatNodeLabel(node));
  const hasChildren = node.children.length > 0;
  const classes = [
    'expectree-node',
    `expectree-node--${node.type.toLowerCase()}`,
    hasChildren ? 'expectree-node--branch' : 'expectree-node--leaf',
  ];

  const attributes = new Set<string>();
  attributes.add(`data-node-type="${escapeAttribute(node.type)}"`);

  if (node instanceof RootNode) {
    classes.push('expectree-node--root');
  }

  if (node instanceof GroupNode && node.alias) {
    attributes.add(`data-node-alias="${escapeAttribute(node.alias)}"`);
  }

  if (node instanceof ExpectationNode) {
    attributes.add(`data-node-id="${escapeAttribute(node.id)}"`);
    if (node.alias) {
      attributes.add(`data-node-alias="${escapeAttribute(node.alias)}"`);
    }
    if (node.group) {
      attributes.add(`data-node-group="${escapeAttribute(node.group)}"`);
    }
    if (node.tags?.length) {
      attributes.add(
        `data-node-tags="${escapeAttribute(node.tags.join(','))}"`
      );
    }
  }

  const status = getNodeStatus(node);
  if (status) {
    attributes.add(`data-node-status="${escapeAttribute(status)}"`);
  }

  const attributeList = [`class="${classes.join(' ')}"`, ...attributes];

  if (hasChildren) {
    if (shouldOpenBranch(depth, options)) {
      attributeList.push('open');
    }

    const childrenMarkup = node.children
      .map(child => renderNode(child, options, depth + 1))
      .join('\n');

    return [
      `<details ${attributeList.join(' ')}>`,
      `<summary><span class="expectree-node-label">${label}</span></summary>`,
      '<div class="expectree-children">',
      childrenMarkup,
      '</div>',
      '</details>',
    ].join('\n');
  }

  return `<div ${attributeList.join(' ')}><span class="expectree-node-label">${label}</span></div>`;
}

function shouldOpenBranch(
  depth: number,
  options: NormalizedHtmlOptions
): boolean {
  if (!options.defaultCollapsed) {
    return true;
  }

  if (depth === 0) {
    return !options.collapseRoot;
  }

  return false;
}

const HTML_ESCAPE_REGEX = /[&<>'`]/g;
const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

function escapeHtml(input: string): string {
  return input.replace(
    HTML_ESCAPE_REGEX,
    match => HTML_ESCAPE_LOOKUP[match] ?? match
  );
}

const escapeAttribute = escapeHtml;

export const __private__ = {
  formatNodeLabel,
  getNodeStatus,
  renderNode,
  renderTree,
  escapeHtml,
  normalizeOptions,
};
