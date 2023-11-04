import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

export const NoRestDestructuringUtils = {
  isObjectRestDestructuring(node: TSESTree.Node): boolean {
    if (node.type !== AST_NODE_TYPES.ObjectPattern) {
      return false
    }
    return node.properties.some((p) => p.type === AST_NODE_TYPES.RestElement)
  },
}
