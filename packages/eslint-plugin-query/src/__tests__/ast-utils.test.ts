import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'
import { ExhaustiveDepsUtils } from '../rules/exhaustive-deps/exhaustive-deps.utils'
import { ASTUtils } from '../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

function createIdentifier(name: string): TSESTree.Identifier {
  return { type: AST_NODE_TYPES.Identifier, name } as TSESTree.Identifier
}

describe('ASTUtils', () => {
  it('stops member traversal when a node has no parent', () => {
    const identifier = createIdentifier('value')

    expect(ASTUtils.traverseUpMemberExpression(identifier)).toBe(identifier)
  })

  it('handles an external reference without a parent', () => {
    const operation = createIdentifier('operation')
    const reference = {
      identifier: operation,
      isRead: () => true,
      resolved: null,
    } as TSESLint.Scope.Reference
    const scope = {
      childScopes: [],
      references: [reference],
      set: new Map(),
    } as unknown as TSESLint.Scope.Scope
    const scopeManager = {
      acquire: () => scope,
    } as unknown as TSESLint.Scope.ScopeManager
    const sourceCode = {
      getText: () => 'operation',
    } as unknown as Readonly<TSESLint.SourceCode>

    expect(
      ASTUtils.getExternalRefs({
        scopeManager,
        sourceCode,
        node: operation,
      }),
    ).toEqual([reference])
  })
})

describe('ExhaustiveDepsUtils', () => {
  it('does not treat a detached identifier as a function call target', () => {
    expect(
      ExhaustiveDepsUtils.isFunctionCallTarget(createIdentifier('fetchTodos')),
    ).toBe(false)
  })
})
