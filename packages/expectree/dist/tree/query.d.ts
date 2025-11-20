/**
 * Query methods for RootNode to avoid circular dependencies.
 * These are added as methods via the index export.
 */
import { RootNode, ExpectationNode } from './nodes';
import { type NodeSelector } from './selectors';
export declare function find(this: RootNode, selector: string | NodeSelector): ExpectationNode[];
export declare function findOne(this: RootNode, selector: string | NodeSelector): ExpectationNode | undefined;
export declare function findByTag(this: RootNode, tag: string): ExpectationNode[];
export declare function findByGroup(this: RootNode, group: string): ExpectationNode[];
export declare function findByAlias(this: RootNode, alias: string): ExpectationNode | undefined;
declare module './nodes' {
    interface RootNode {
        find(selector: string | NodeSelector): ExpectationNode[];
        findOne(selector: string | NodeSelector): ExpectationNode | undefined;
        findByTag(tag: string): ExpectationNode[];
        findByGroup(group: string): ExpectationNode[];
        findByAlias(alias: string): ExpectationNode | undefined;
    }
}
