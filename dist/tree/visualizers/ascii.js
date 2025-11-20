import { formatNodeLabel, getNodeStatus } from './shared';
const ASCII_INDENT_WITH_BRANCH = '|  ';
const ASCII_INDENT_NO_BRANCH = '   ';
const ASCII_INDENT_SKIPPED = '·  ';
function renderChildren(lines, children, prefix, isSkipped = false) {
    children.forEach((child, index) => {
        const isLast = index === children.length - 1;
        const status = getNodeStatus(child);
        const childIsSkipped = isSkipped || status === 'SKIPPED';
        const connector = childIsSkipped
            ? (isLast ? '·-' : '·+')
            : (isLast ? '\\-' : '+-');
        const line = `${prefix}${connector} ${formatNodeLabel(child, status)}`;
        lines.push(line);
        const nextPrefix = `${prefix}${childIsSkipped
            ? ASCII_INDENT_SKIPPED
            : (isLast ? ASCII_INDENT_NO_BRANCH : ASCII_INDENT_WITH_BRANCH)}`;
        const childChildren = child.children;
        if (childChildren.length > 0) {
            renderChildren(lines, childChildren, nextPrefix, childIsSkipped);
        }
    });
}
function renderRoot(root) {
    if (root.isEmpty()) {
        return 'ROOT (empty)';
    }
    const lines = [formatNodeLabel(root)];
    renderChildren(lines, root.children, '');
    return lines.join('\n');
}
export const asciiTreeVisualizer = {
    id: 'ascii',
    label: 'ASCII',
    description: 'Plain-text tree layout using ASCII branches',
    render(root, _options) {
        return renderRoot(root);
    },
};
// Useful for unit testing internal helpers
export const __private__ = {
    formatNodeLabel,
    renderRoot,
};
