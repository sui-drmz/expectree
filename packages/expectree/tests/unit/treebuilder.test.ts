import { describe, it, expect } from 'vitest';
import {
  AndNode,
  ExpectationNode,
  GroupNode,
  NotNode,
  OrNode,
  RootNode,
} from '@/tree/nodes';
import { TreeBuilder } from '@/tree/TreeBuilder';
import {
  DuplicateAliasError,
  EmptyGroupError,
  EmptyTreeError,
  ExpectationCombinationError,
  IncompleteOperationError,
  MissingOperandError,
  MultipleNodesError,
} from '@/tree/exceptions';
import { node } from '@/builder';

const leaf = (id: string) => new ExpectationNode(id, { type: 't' });

describe('TreeBuilder', () => {
  it('builds a simple expectation', () => {
    const root = new TreeBuilder().addExpectation(leaf('a')).build();
    expect(root).toBeInstanceOf(RootNode);
    expect(root.child).toBeInstanceOf(ExpectationNode);
  });

  it('combines with AND and OR and NOT and GROUP', () => {
    const root = new TreeBuilder()
      .addExpectation(leaf('a'))
      .and()
      .addExpectation(leaf('b'))
      .or()
      .group(b => b.addExpectation(leaf('c')).not())
      .build();

    expect(root.child).toBeInstanceOf(OrNode);
    const or = root.child as OrNode;
    expect(or.left).toBeInstanceOf(AndNode);
    expect(or.right).toBeInstanceOf(GroupNode);
    const group = or.right as GroupNode;
    expect(group.child).toBeInstanceOf(NotNode);
  });

  it('throws when adding expectation without operator between', () => {
    const b = new TreeBuilder();
    b.addExpectation(leaf('a'));
    expect(() => b.addExpectation(leaf('b'))).toThrow(
      ExpectationCombinationError
    );
  });

  it('throws MissingOperandError on and/or without left', () => {
    expect(() => new TreeBuilder().and()).toThrow(MissingOperandError);
    expect(() => new TreeBuilder().or()).toThrow(MissingOperandError);
  });

  it('throws MissingOperandError on not without operand', () => {
    expect(() => new TreeBuilder().not()).toThrow(MissingOperandError);
  });

  it('throws IncompleteOperationError when build with pending op', () => {
    const b = new TreeBuilder().addExpectation(leaf('a')).and();
    expect(() => b.build()).toThrow(IncompleteOperationError);
  });

  it('throws MultipleNodesError when multiple nodes left', () => {
    const b = new TreeBuilder().addExpectation(leaf('a'));
    // push another separate group so two nodes exist without combining
    b.group(x => x.addExpectation(leaf('b')));
    expect(() => b.build()).toThrow(MultipleNodesError);
  });

  it('throws EmptyGroupError for empty group', () => {
    const b = new TreeBuilder();
    expect(() => b.group(() => new TreeBuilder())).toThrow(EmptyGroupError);
  });

  it('throws EmptyTreeError for empty build', () => {
    const b = new TreeBuilder();
    expect(() => b.build()).toThrow(EmptyTreeError);
  });

  it('visualize keeps builder state intact', () => {
    const builder = new TreeBuilder();
    const a = leaf('a');
    const b = leaf('b');

    builder.addExpectation(a).and().addExpectation(b);

    const preview = builder.visualize();
    expect(preview).toContain('ROOT');

    const tree = builder.build();

    a.fulfill();
    expect(tree.status).toBe('PENDING');

    b.fulfill();
    expect(tree.status).toBe('PASSED');
  });

  it('throws when aliases collide (including nested paths)', () => {
    const builder = new TreeBuilder()
      .addExpectation(node('user.isLoggedIn', { type: 'user' }))
      .and()
      .addExpectation(node('user.isLoggedIn', { type: 'user' }));

    expect(() => builder.build()).toThrow(DuplicateAliasError);
  });
});
