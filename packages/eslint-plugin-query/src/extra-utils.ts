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
  isLiteral(node: TSESTree.Node): node is TSESTree.Literal {
    return node.type === AST_NODE_TYPES.Literal
  },
  isTemplateLiteral(node: TSESTree.Node): node is TSESTree.TemplateLiteral {
    return node.type === AST_NODE_TYPES.TemplateLiteral
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
  getIdentifiersFromArrayExpression(
    node: TSESTree.ArrayExpression,
  ): TSESTree.Identifier[] {
    const identifiers: TSESTree.Identifier[] = []

    for (const element of node.elements) {
      if (ExtraUtils.isIdentifier(element)) {
        identifiers.push(element)
      }

      if (ExtraUtils.isTemplateLiteral(element)) {
        element.expressions.forEach((expression) => {
          if (ExtraUtils.isIdentifier(expression)) {
            identifiers.push(expression)
          }
        })
      }
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
}
