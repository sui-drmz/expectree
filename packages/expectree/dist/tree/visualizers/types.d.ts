import type { RootNode } from '../nodes';
export type VisualizerRenderOptions = Record<string, unknown>;
export interface TreeVisualizer {
    /** Unique identifier for the visualizer (e.g., "ascii") */
    id: string;
    /** Human-friendly name for UI selectors */
    label?: string;
    /** Optional description for documentation or tooling */
    description?: string;
    /**
     * Produce a string representation of the tree.
     * Implementations may leverage {@link RootNode.hasState} or other helpers
     * when rendering.
     */
    render(root: RootNode, options?: VisualizerRenderOptions): string;
}
export type VisualizerInput = string | TreeVisualizer;
export interface VisualizeOptions {
    /** Which visualizer to use when rendering */
    visualizer?: VisualizerInput;
    /** Arbitrary options passed through to the visualizer implementation */
    renderOptions?: VisualizerRenderOptions;
}
export type VisualizeParam = VisualizeOptions | VisualizerInput | undefined;
