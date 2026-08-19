import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { uniqueBy } from './unique-by'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export const ASTUtils = {
  isNodeOfOneOf<T extends AST_NODE_TYPES>(
    node: TSESTree.Node,
    types: ReadonlyArray<T>,
  ): node is TSESTree.Node & { type: T } {
    return types.includes(node.type as T)
  },
  isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
    return node.type === AST_NODE_TYPES.Identifier
  },
  isIdentifierWithName(
    node: TSESTree.Node,
    name: string,
  ): node is TSESTree.Identifier {
    return ASTUtils.isIdentifier(node) && node.name === name
  },
  isIdentifierWithOneOfNames<T extends Array<string>>(
    node: TSESTree.Node,
    name: T,
  ): node is TSESTree.Identifier & { name: T[number] } {
    return ASTUtils.isIdentifier(node) && name.includes(node.name)
  },
  isProperty(node: TSESTree.Node): node is TSESTree.Property {
    return node.type === AST_NODE_TYPES.Property
  },
  isObjectExpression(node: TSESTree.Node): node is TSESTree.ObjectExpression {
    return node.type === AST_NODE_TYPES.ObjectExpression
  },
  isPropertyWithIdentifierKey(
    node: TSESTree.Node,
    key: string,
  ): node is TSESTree.Property {
    return (
      ASTUtils.isProperty(node) && ASTUtils.isIdentifierWithName(node.key, key)
    )
  },
  findPropertyWithIdentifierKey(
    properties: Array<TSESTree.ObjectLiteralElement>,
    key: string,
  ): TSESTree.Property | undefined {
    return properties.find((x): x is TSESTree.Property =>
      ASTUtils.isPropertyWithIdentifierKey(x, key),
    )
  },
  traverseUpOnly(
    identifier: TSESTree.Node,
    allowedNodeTypes: Array<AST_NODE_TYPES>,
  ): TSESTree.Node {
    const parent = identifier.parent

    if (parent !== undefined && allowedNodeTypes.includes(parent.type)) {
      return ASTUtils.traverseUpOnly(parent, allowedNodeTypes)
    }

    return identifier
  },
  traverseUpMemberExpression(node: TSESTree.Node): TSESTree.Node {
    const parent = node.parent

    if (
      parent !== undefined &&
      ((parent.type === AST_NODE_TYPES.MemberExpression &&
        parent.object === node) ||
        parent.type === AST_NODE_TYPES.ChainExpression ||
        parent.type === AST_NODE_TYPES.TSNonNullExpression)
    ) {
      return ASTUtils.traverseUpMemberExpression(parent)
    }

    return node
  },
  isDeclaredInNode(params: {
    functionNode: TSESTree.Node
    reference: TSESLint.Scope.Reference
    scopeManager: TSESLint.Scope.ScopeManager
  }) {
    const { functionNode, reference, scopeManager } = params
    const scope = scopeManager.acquire(functionNode)

    if (scope === null) {
      return false
    }

    return scope.set.has(reference.identifier.name)
  },
  getExternalRefs(params: {
    scopeManager: TSESLint.Scope.ScopeManager
    sourceCode: Readonly<TSESLint.SourceCode>
    node: TSESTree.Node
  }): Array<TSESLint.Scope.Reference> {
    const { scopeManager, sourceCode, node } = params
    const scope = scopeManager.acquire(node)

    if (scope === null) {
      return []
    }

    const collectReferences = (
      currentScope: TSESLint.Scope.Scope,
    ): Array<TSESLint.Scope.Reference> => {
      const references = [...currentScope.references]

      for (const childScope of currentScope.childScopes) {
        references.push(...collectReferences(childScope))
      }

      return references
    }

    const references = collectReferences(scope)
      .filter((x) => x.isRead() && !scope.set.has(x.identifier.name))
      .map((x) => {
        const memberPath = ASTUtils.traverseUpMemberExpression(x.identifier)
        const memberExpression = memberPath.parent
        const isComputedCallProperty =
          memberExpression !== undefined &&
          memberExpression.type === AST_NODE_TYPES.MemberExpression &&
          memberExpression.computed &&
          memberExpression.property === memberPath &&
          memberExpression.parent.type === AST_NODE_TYPES.CallExpression &&
          memberExpression.parent.callee === memberExpression

        const referenceNode = isComputedCallProperty
          ? memberPath
          : ASTUtils.traverseUpOnly(x.identifier, [
              AST_NODE_TYPES.MemberExpression,
              AST_NODE_TYPES.Identifier,
            ])

        return {
          variable: x,
          node: referenceNode,
          text: sourceCode.getText(referenceNode),
        }
      })

    const localRefIds = new Set(
      [...scope.set.values()].map((x) => sourceCode.getText(x.identifiers[0])),
    )

    const externalRefs = references.filter(
      (x) => x.variable.resolved === null || !localRefIds.has(x.text),
    )

    return uniqueBy(externalRefs, (x) => x.text).map((x) => x.variable)
  },
  isValidReactComponentOrHookName(
    identifier: TSESTree.Identifier | null | undefined,
  ) {
    return (
      identifier !== null &&
      identifier !== undefined &&
      /^(use|[A-Z])/.test(identifier.name)
    )
  },
  getFunctionAncestor(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
  ) {
    for (const ancestor of sourceCode.getAncestors(node)) {
      if (
        ASTUtils.isNodeOfOneOf(ancestor, [
          AST_NODE_TYPES.FunctionDeclaration,
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ])
      ) {
        return ancestor
      }

      if (
        ancestor.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        ancestor.parent.id.type === AST_NODE_TYPES.Identifier &&
        ASTUtils.isNodeOfOneOf(ancestor, [
          AST_NODE_TYPES.FunctionDeclaration,
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ])
      ) {
        return ancestor
      }
    }

    return undefined
  },
  getReferencedExpressionByIdentifier(params: {
    node: TSESTree.Node
    context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>
  }) {
    const { node, context } = params

    // we need the fallbacks for backwards compat with eslint < 8.37.0
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const scope = context.sourceCode.getScope(node)
      ? sourceCode.getScope(node)
      : context.getScope()

    const resolvedNode = scope.references.find((ref) => ref.identifier === node)
      ?.resolved?.defs[0]?.node

    if (resolvedNode?.type !== AST_NODE_TYPES.VariableDeclarator) {
      return null
    }

    return resolvedNode.init
  },
}
