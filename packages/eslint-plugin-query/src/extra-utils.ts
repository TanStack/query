import type { TSESTree } from '@typescript-eslint/types'
import { AST_NODE_TYPES } from '@typescript-eslint/types'

export const ExtraUtils = {
  isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
    return node.type === AST_NODE_TYPES.Identifier
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
  isPropertyWithIdentifierKey(
    node: TSESTree.Node,
    key: string,
  ): node is TSESTree.Property {
    return (
      ExtraUtils.isProperty(node) &&
      ExtraUtils.isIdentifier(node.key) &&
      node.key.name === key
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
}
