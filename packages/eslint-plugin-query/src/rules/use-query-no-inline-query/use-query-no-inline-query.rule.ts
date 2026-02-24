import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectQueryOptionsInObject } from '../../utils/detect-query-options-in-object'
import type { ExtraRuleDocs } from '../../types'

export const name = 'use-query-no-inline-query'

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
        if (node.callee.type !== AST_NODE_TYPES.Identifier) return
        if (!useQueryHooks.includes(node.callee.name)) return

        // use*Query hook call
        if (!node.arguments[0]) return

        // if caller first argument is an object
        const queryNode = node.arguments[0]

        if (detectQueryOptionsInObject(queryNode))
          context.report({
            messageId: 'no-inline-query',
            node,
          })
      },
    }
  },
})
