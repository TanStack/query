import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { uniqueBy } from './unique-by'

export const ASTUtils = {
  isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
    return node.type === AST_NODE_TYPES.Identifier
  },
  isIdentifierWithName(
    node: TSESTree.Node,
    name: string,
  ): node is TSESTree.Identifier {
    return ASTUtils.isIdentifier(node) && node.name === name
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
    properties: TSESTree.ObjectLiteralElement[],
    key: string,
  ): TSESTree.Property | undefined {
    return properties.find((x) =>
      ASTUtils.isPropertyWithIdentifierKey(x, key),
    ) as TSESTree.Property | undefined
  },
  getNestedIdentifiers(node: TSESTree.Node): TSESTree.Identifier[] {
    const identifiers: TSESTree.Identifier[] = []

    if (ASTUtils.isIdentifier(node)) {
      identifiers.push(node)
    }

    if (node.type === AST_NODE_TYPES.ArrayExpression) {
      node.elements.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.ObjectExpression) {
      node.properties.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.Property) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.value))
    }

    if (node.type === AST_NODE_TYPES.TemplateLiteral) {
      node.expressions.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.MemberExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.object))
    }

    if (node.type === AST_NODE_TYPES.UnaryExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.argument))
    }

    if (node.type === AST_NODE_TYPES.ChainExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.expression))
    }

    if (node.type === AST_NODE_TYPES.TSNonNullExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.expression))
    }

    return identifiers
  },
  isAncestorIsCallee(identifier: TSESTree.Node) {
    let previousNode = identifier
    let currentNode = identifier.parent

    while (currentNode !== undefined) {
      if (
        currentNode.type === AST_NODE_TYPES.CallExpression &&
        currentNode.callee === previousNode
      ) {
        return true
      }

      if (currentNode.type !== AST_NODE_TYPES.MemberExpression) {
        return false
      }

      previousNode = currentNode
      currentNode = currentNode.parent
    }

    return false
  },
  traverseUpOnly(
    identifier: TSESTree.Node,
    allowedNodeTypes: AST_NODE_TYPES[],
  ): TSESTree.Node {
    const parent = identifier.parent

    if (parent !== undefined && allowedNodeTypes.includes(parent.type)) {
      return ASTUtils.traverseUpOnly(parent, allowedNodeTypes)
    }

    return identifier
  },
  getRangeOfArguments(
    node: TSESTree.CallExpression,
  ): TSESTree.Range | undefined {
    const firstArgument = node.arguments[0]
    const lastArgument = node.arguments[node.arguments.length - 1]
    return firstArgument && lastArgument
      ? [firstArgument.range[0], lastArgument.range[1]]
      : undefined
  },
  getExternalRefs(params: {
    scopeManager: TSESLint.Scope.ScopeManager
    node: TSESTree.Node
  }): TSESLint.Scope.Reference[] {
    const { scopeManager, node } = params
    const scope = scopeManager.acquire(node)

    if (scope === null) {
      return []
    }

    const readOnlyRefs = scope.references.filter((x) => x.isRead())
    const localRefIds = new Set(
      [...scope.set.values()].map((x) => x.identifiers[0]),
    )
    const externalRefs = readOnlyRefs.filter(
      (x) => x.resolved === null || !localRefIds.has(x.resolved.identifiers[0]),
    )

    return uniqueBy(externalRefs, (x) => x.resolved)
  },
  mapKeyNodeToText(
    node: TSESTree.Node,
    sourceCode: Readonly<TSESLint.SourceCode>,
  ) {
    return sourceCode.getText(
      ASTUtils.traverseUpOnly(node, [
        AST_NODE_TYPES.MemberExpression,
        AST_NODE_TYPES.Identifier,
      ]),
    )
  },
}
