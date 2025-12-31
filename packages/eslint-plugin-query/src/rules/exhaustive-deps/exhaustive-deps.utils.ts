import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export const ExhaustiveDepsUtils = {
  isRelevantReference(params: {
    sourceCode: Readonly<TSESLint.SourceCode>
    reference: TSESLint.Scope.Reference
    scopeManager: TSESLint.Scope.ScopeManager
    node: TSESTree.Node
    filename: string
  }) {
    const { sourceCode, reference, scopeManager, node, filename } = params
    const component = ASTUtils.getFunctionAncestor(sourceCode, node)

    if (component !== undefined) {
      if (
        !ASTUtils.isDeclaredInNode({
          scopeManager,
          reference,
          functionNode: component,
        })
      ) {
        return false
      }
    } else {
      const isVueFile = filename.endsWith('.vue')

      if (!isVueFile) {
        return false
      }

      const definition = reference.resolved?.defs[0]
      const isGlobalVariable = definition === undefined
      const isImport = definition?.type === 'ImportBinding'

      if (isGlobalVariable || isImport) {
        return false
      }

    }

    return (
      reference.identifier.name !== 'undefined' &&
      reference.identifier.parent.type !== AST_NODE_TYPES.NewExpression &&
      !ExhaustiveDepsUtils.isInstanceOfKind(reference.identifier.parent)
    )
  },
  isInstanceOfKind(node: TSESTree.Node) {
    return (
      node.type === AST_NODE_TYPES.BinaryExpression &&
      node.operator === 'instanceof'
    )
  },
}
