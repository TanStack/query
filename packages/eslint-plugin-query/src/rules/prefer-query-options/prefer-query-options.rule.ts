import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectQueryOptionsInObject } from './prefer-query-options.utils'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'prefer-query-options'

const useQueryHooks = [
  // see https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
  'useQuery',
  // 'useQueries', // only works for single queries for now
  'useInfiniteQuery',
  'useSuspenseQuery',
  // 'useSuspenseQueries',
  'useSuspenseInfiniteQuery',
]

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

/** @returns true if it's a `useQuery` hook call expression node */
function isQueryHookCallExpression(node: TSESTree.CallExpression) {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) return false
  if (!useQueryHooks.includes(node.callee.name)) return false
  return true
}

/** @returns true if it's a call to `queryClient.invalidateQueries` */
function isInvalidateQueriesCallExpression(node: TSESTree.CallExpression) {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === 'queryClient' &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'invalidateQueries'
  )
}

export const rule = createRule({
  name,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensures queryOptions constructor pattern is used when calling query apis',
      recommended: 'warn',
    },
    messages: {
      'no-inline-query-hook': 'Expected query hook to use queryOptions pattern',
      'no-inline-query-invalidate':
        'Expected query invalidate call to use queryOptions pattern',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // use*Query hook call
        if (
          isQueryHookCallExpression(node) &&
          node.arguments[0] &&
          detectQueryOptionsInObject(node.arguments[0])
        ) {
          context.report({ messageId: 'no-inline-query-hook', node })
        }

        // queryClient.invalidateQueries call
        if (
          isInvalidateQueriesCallExpression(node) &&
          node.arguments[0] &&
          detectQueryOptionsInObject(node.arguments[0])
        ) {
          context.report({ messageId: 'no-inline-query-invalidate', node })
        }
      },
    }
  },
})
