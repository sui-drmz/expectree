import { RootNode } from '../nodes';
import type { VisualizeParam, TreeVisualizer } from './types';
export declare function registerVisualizer(visualizer: TreeVisualizer, { override }?: {
    override?: boolean;
}): void;
export declare function unregisterVisualizer(id: string): void;
export declare function listVisualizers(): TreeVisualizer[];
export declare function getVisualizer(id: string): TreeVisualizer;
export type { TreeVisualizer, VisualizerInput, VisualizeOptions, VisualizeParam, VisualizerRenderOptions, } from './types';
export { asciiTreeVisualizer } from './ascii';
export { htmlTreeVisualizer } from './html';
export type { HtmlVisualizerOptions } from './html';
export declare function visualizeTree(root: RootNode, param?: VisualizeParam): string;
declare module '../nodes' {
    interface RootNode {
        visualize(param?: VisualizeParam): string;
    }
}
