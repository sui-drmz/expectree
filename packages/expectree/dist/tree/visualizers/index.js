import { RootNode } from '../nodes';
import { asciiTreeVisualizer } from './ascii';
import { htmlTreeVisualizer } from './html';
const registry = new Map();
// Register built-in visualizers immediately when the module loads
// This ensures they're available even in edge cases with webpack/Next.js
registry.set(asciiTreeVisualizer.id, asciiTreeVisualizer);
registry.set(htmlTreeVisualizer.id, htmlTreeVisualizer);
function ensureRegisteredDefault() {
    if (!registry.has(asciiTreeVisualizer.id)) {
        registry.set(asciiTreeVisualizer.id, asciiTreeVisualizer);
    }
}
function resolveVisualizerInput(input) {
    ensureRegisteredDefault();
    if (!input) {
        const [first] = registry.values();
        if (!first) {
            throw new Error('No tree visualizers registered.');
        }
        return first;
    }
    if (typeof input === 'string') {
        const visualizer = registry.get(input);
        if (!visualizer) {
            throw new Error(`Tree visualizer "${input}" is not registered.`);
        }
        return visualizer;
    }
    return input;
}
function normalizeOptions(param) {
    if (!param || typeof param === 'string' || 'render' in param) {
        return { visualizer: resolveVisualizerInput(param) };
    }
    const options = param;
    const visualizer = resolveVisualizerInput(options.visualizer);
    return { visualizer, renderOptions: options.renderOptions };
}
export function registerVisualizer(visualizer, { override = true } = {}) {
    ensureRegisteredDefault();
    if (!override && registry.has(visualizer.id)) {
        throw new Error(`Tree visualizer "${visualizer.id}" is already registered.`);
    }
    registry.set(visualizer.id, visualizer);
}
export function unregisterVisualizer(id) {
    // Prevent removing the default ASCII visualizer entirely
    ensureRegisteredDefault();
    if (id === asciiTreeVisualizer.id) {
        throw new Error('Cannot unregister the default ASCII visualizer.');
    }
    registry.delete(id);
}
export function listVisualizers() {
    ensureRegisteredDefault();
    return Array.from(registry.values());
}
export function getVisualizer(id) {
    ensureRegisteredDefault();
    const visualizer = registry.get(id);
    if (!visualizer) {
        throw new Error(`Tree visualizer "${id}" is not registered.`);
    }
    return visualizer;
}
export { asciiTreeVisualizer } from './ascii';
export { htmlTreeVisualizer } from './html';
export function visualizeTree(root, param) {
    const { visualizer, renderOptions } = normalizeOptions(param);
    return visualizer.render(root, renderOptions);
}
function visualize(param) {
    return visualizeTree(this, param);
}
Object.assign(RootNode.prototype, {
    visualize,
});
