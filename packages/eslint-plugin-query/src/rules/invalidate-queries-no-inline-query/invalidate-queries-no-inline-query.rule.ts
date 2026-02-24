import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectQueryOptionsInObject } from '../../utils/detect-query-options-in-object'
import type { ExtraRuleDocs } from '../../types'

export const name = 'invalidate-queries-no-inline-query'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Enforces queryClient.invalidateQueries don't have inline queries. Will error if queryKey or queryFn properties are passed to the function",
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
        if (
          // check queryClient.invalidateQueries
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === 'queryClient' &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === 'invalidateQueries'
        ) {
          if (!node.arguments[0]) return

          if (detectQueryOptionsInObject(node.arguments[0]))
            context.report({
              messageId: 'no-inline-query',
              node,
            })
        }
      },
    }
  },
})
