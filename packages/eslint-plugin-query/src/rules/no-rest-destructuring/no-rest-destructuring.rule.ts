import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { NoRestDestructuringUtils } from './no-rest-destructuring.utils'

export const name = 'no-rest-destructuring'

const queryHooks = ['useQuery', 'useQueries', 'useInfiniteQuery']

const createRule = ESLintUtils.RuleCreator(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallows rest destructuring in queries',
      recommended: 'warn' as any,
    },
    messages: {
      objectRestDestructure: `Object rest destructuring on a query will observe all changes to the query, leading to excessive re-renders.`,
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _, helpers) => {
    return {
      CallExpression: (node) => {
        if (
          !ASTUtils.isIdentifierWithOneOfNames(node.callee, queryHooks) ||
          !helpers.isTanstackQueryImport(node.callee) ||
          node.parent.type !== AST_NODE_TYPES.VariableDeclarator
        ) {
          return
        }

        const returnValue = node.parent.id
        if (node.callee.name !== 'useQueries') {
          if (NoRestDestructuringUtils.isObjectRestDestructuring(returnValue)) {
            context.report({
              node: node.parent,
              messageId: 'objectRestDestructure',
            })
          }
          return
        }

        if (returnValue.type !== AST_NODE_TYPES.ArrayPattern) {
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
    }
  }),
})
