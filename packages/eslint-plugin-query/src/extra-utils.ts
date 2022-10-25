import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export const ExtraUtils = {
  isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
    return node.type === AST_NODE_TYPES.Identifier
  },
  isIdentifierWithName(
    node: TSESTree.Node,
    name: string,
  ): node is TSESTree.Identifier {
    return ExtraUtils.isIdentifier(node) && node.name === name
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
      ExtraUtils.isProperty(node) &&
      ExtraUtils.isIdentifierWithName(node.key, key)
    )
  },
  findPropertyWithIdentifierKey(
    properties: TSESTree.ObjectLiteralElement[],
    key: string,
  ): TSESTree.Property | undefined {
    return properties.find((x) =>
      ExtraUtils.isPropertyWithIdentifierKey(x, key),
    ) as TSESTree.Property | undefined
  },
  getNestedIdentifiers(node: TSESTree.Node): TSESTree.Identifier[] {
    const identifiers: TSESTree.Identifier[] = []

    if (ExtraUtils.isIdentifier(node)) {
      identifiers.push(node)
    }

    if (node.type === AST_NODE_TYPES.ArrayExpression) {
      node.elements.forEach((x) => {
        identifiers.push(...ExtraUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.ObjectExpression) {
      node.properties.forEach((x) => {
        identifiers.push(...ExtraUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.Property) {
      identifiers.push(...ExtraUtils.getNestedIdentifiers(node.value))
    }

    if (node.type === AST_NODE_TYPES.TemplateLiteral) {
      node.expressions.forEach((x) => {
        identifiers.push(...ExtraUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.MemberExpression) {
      identifiers.push(...ExtraUtils.getNestedIdentifiers(node.object))
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
      return ExtraUtils.traverseUpOnly(parent, allowedNodeTypes)
    }

    return identifier
  },
}
