import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export const ExhaustiveDepsUtils = {
  isRelevantReference(params: {
    context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>
    reference: TSESLint.Scope.Reference
    scopeManager: TSESLint.Scope.ScopeManager
  }) {
    const { reference, scopeManager, context } = params
    const component = ASTUtils.getFunctionAncestor(context)

    if (
      component !== undefined &&
      !ASTUtils.isDeclaredInNode({
        scopeManager,
        reference,
        functionNode: component,
      })
    ) {
      return false
    }

    return (
      reference.identifier.name !== 'undefined' &&
      reference.identifier.parent.type !== AST_NODE_TYPES.NewExpression &&
      !ExhaustiveDepsUtils.isInstanceOfKind(reference.identifier.parent) &&
      !ExhaustiveDepsUtils.isQueryClientReference(reference)
    )
  },
  isInstanceOfKind(node: TSESTree.Node) {
    return (
      node.type === AST_NODE_TYPES.BinaryExpression &&
      node.operator === 'instanceof'
    )
  },
  isQueryClientReference(reference: TSESLint.Scope.Reference) {
    const declarator = reference.resolved?.defs[0]?.node

    return (
      declarator?.type === AST_NODE_TYPES.VariableDeclarator &&
      declarator.init?.type === AST_NODE_TYPES.CallExpression &&
      declarator.init.callee.type === AST_NODE_TYPES.Identifier &&
      declarator.init.callee.name === 'useQueryClient'
    )
  },
}
