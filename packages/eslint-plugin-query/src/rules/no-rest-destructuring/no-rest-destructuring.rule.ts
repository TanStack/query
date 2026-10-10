import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { NoRestDestructuringUtils } from './no-rest-destructuring.utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'no-rest-destructuring'

const queryHooks = [
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
    type: 'problem',
    docs: {
      description: 'Disallows rest destructuring in queries',
      recommended: 'warn',
    },
    messages: {
      objectRestDestructure: `Object rest destructuring on a query will observe all changes to the query, leading to excessive re-renders.`,
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _, helpers) => {
    const queryResultVariables = new Set<string>()

    return {
      CallExpression: (node) => {
        if (node.parent.type !== AST_NODE_TYPES.VariableDeclarator) {
          return
        }

        const returnValue = node.parent.id

        const isDirectHook =
          ASTUtils.isIdentifierWithOneOfNames(node.callee, queryHooks) &&
          helpers.isTanstackQueryImport(node.callee)

        if (!isDirectHook) {
          // The type-aware path can only report when the result is rest
          // destructured or assigned to an identifier that may later be
          // spread. Skip the expensive type lookup for any other binding.
          const canReportQueryResult =
            returnValue.type === AST_NODE_TYPES.Identifier ||
            NoRestDestructuringUtils.isObjectRestDestructuring(returnValue)

          if (
            !canReportQueryResult ||
            !NoRestDestructuringUtils.isQueryResultCall(
              node,
              context.sourceCode.parserServices,
            )
          ) {
            return
          }
        }

        const calleeName = ASTUtils.isIdentifier(node.callee)
          ? node.callee.name
          : null

        if (
          calleeName !== 'useQueries' &&
          calleeName !== 'useSuspenseQueries'
        ) {
          if (NoRestDestructuringUtils.isObjectRestDestructuring(returnValue)) {
            return context.report({
              node: node.parent,
              messageId: 'objectRestDestructure',
            })
          }

          if (returnValue.type === AST_NODE_TYPES.Identifier) {
            queryResultVariables.add(returnValue.name)
          }

          return
        }

        if (returnValue.type !== AST_NODE_TYPES.ArrayPattern) {
          if (returnValue.type === AST_NODE_TYPES.Identifier) {
            queryResultVariables.add(returnValue.name)
          }
          return
        }

        returnValue.elements.forEach((queryResult) => {
          if (queryResult === null) {
            return
          }
          if (NoRestDestructuringUtils.isObjectRestDestructuring(queryResult)) {
            context.report({
              node: queryResult,
              messageId: 'objectRestDestructure',
            })
          }
        })
      },

      VariableDeclarator: (node) => {
        if (
          node.init?.type === AST_NODE_TYPES.Identifier &&
          queryResultVariables.has(node.init.name) &&
          NoRestDestructuringUtils.isObjectRestDestructuring(node.id)
        ) {
          context.report({
            node,
            messageId: 'objectRestDestructure',
          })
        }
      },

      SpreadElement: (node) => {
        if (
          node.argument.type === AST_NODE_TYPES.Identifier &&
          queryResultVariables.has(node.argument.name)
        ) {
          context.report({
            node,
            messageId: 'objectRestDestructure',
          })
        }
      },
    }
  }),
})
