import { RootNode } from '../nodes';
import type { TreeVisualizer } from './types';
import { formatNodeLabel } from './shared';
declare function renderRoot(root: RootNode): string;
export declare const asciiTreeVisualizer: TreeVisualizer;
export declare const __private__: {
    formatNodeLabel: typeof formatNodeLabel;
    renderRoot: typeof renderRoot;
};
export {};
