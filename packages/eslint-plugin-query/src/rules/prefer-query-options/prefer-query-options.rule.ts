import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectQueryOptionsInObject } from '../../utils/detect-query-options-in-object'
import type { ExtraRuleDocs } from '../../types'

export const name = 'prefer-query-options'

const useQueryHooks = [
  // see https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
  'useQuery',
  'useQueries',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseQueries',
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
        'Enforces useQuery (and family) hooks use some form of query constructor pattern. Will error if queryKey or queryFn properties are passed to the hook',
      recommended: 'warn',
    },
    messages: {
      'no-inline-query': 'Expected query hook to use queryOptions pattern',
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    return {
      CallExpression(node) {
        // use*Query hook call
        if (isQueryHookCallExpression(node)) {
          if (!node.arguments[0]) return

          if (detectQueryOptionsInObject(node.arguments[0]))
            context.report({ messageId: 'no-inline-query', node })
        }

        // queryClient.invalidateQueries call
        if (isInvalidateQueriesCallExpression(node)) {
          if (!node.arguments[0]) return

          if (detectQueryOptionsInObject(node.arguments[0]))
            context.report({ messageId: 'no-inline-query', node })
        }
      },
    }
  },
})
