import { Node, RootNode } from '../nodes';
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
export declare const htmlTreeVisualizer: TreeVisualizer;
declare function normalizeOptions(options?: HtmlVisualizerOptions): NormalizedHtmlOptions;
declare function renderTree(root: RootNode, options: NormalizedHtmlOptions): string;
declare function renderNode(node: Node, options: NormalizedHtmlOptions, depth: number): string;
declare function escapeHtml(input: string): string;
export declare const __private__: {
    formatNodeLabel: typeof formatNodeLabel;
    getNodeStatus: typeof getNodeStatus;
    renderNode: typeof renderNode;
    renderTree: typeof renderTree;
    escapeHtml: typeof escapeHtml;
    normalizeOptions: typeof normalizeOptions;
};
export {};
