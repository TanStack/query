import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'

const MAIN_QUERY_PROPERTIES = ['queryKey', 'queryFn']

/**
 * @returns true if the node is an object that has main query options (ie queryKey or queryFn).
 * This is used for detecting inline query options in hooks and functions
 */
export function detectQueryOptionsInObject(queryNode: TSESTree.Node) {
  // skip if it's not an object
  if (queryNode.type !== AST_NODE_TYPES.ObjectExpression) return false

  // check if any of the properties is queryKey or queryFn
  const hasMainQueryProperties = queryNode.properties.find(
    (property) =>
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      MAIN_QUERY_PROPERTIES.includes(property.key.name),
  )

  return hasMainQueryProperties
}
