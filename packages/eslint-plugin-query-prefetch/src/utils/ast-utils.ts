import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export const ASTUtils = {
  isPropertyWithIdentifierKey(
    node: TSESTree.Node,
    key: string,
  ): node is TSESTree.Property {
    return (
      node.type === AST_NODE_TYPES.Property &&
      node.key.type === AST_NODE_TYPES.Identifier &&
      node.key.name === key
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
}
