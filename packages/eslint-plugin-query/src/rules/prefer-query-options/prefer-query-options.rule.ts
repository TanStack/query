import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { getDocsUrl } from '../../utils/get-docs-url'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'prefer-query-options'

const queryHooks = [
  'useQuery',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseInfiniteQuery',
  'usePrefetchQuery',
  'usePrefetchInfiniteQuery',
]

const queriesHooks = ['useQueries', 'useSuspenseQueries']

const filterHooks = ['useIsFetching']

const queryClientOptionMethods = [
  'fetchQuery',
  'prefetchQuery',
  'fetchInfiniteQuery',
  'prefetchInfiniteQuery',
  'ensureQueryData',
  'ensureInfiniteQueryData',
]

const queryClientQueryKeyMethods = [
  'getQueryData',
  'setQueryData',
  'getQueryState',
  'setQueryDefaults',
  'getQueryDefaults',
]

const queryClientFilterMethods = [
  'invalidateQueries',
  'cancelQueries',
  'refetchQueries',
  'removeQueries',
  'resetQueries',
  'isFetching',
  'getQueriesData',
  'setQueriesData',
]

const queryOptionsBuilders = ['queryOptions', 'infiniteQueryOptions']

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prefer using queryOptions() to co-locate queryKey and queryFn',
      recommended: 'strict',
    },
    messages: {
      preferQueryOptions:
        'Prefer using queryOptions() or infiniteQueryOptions() to co-locate queryKey and queryFn.',
      preferQueryOptionsQueryKey:
        'Prefer referencing a queryKey from a queryOptions() result instead of typing it manually.',
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _, helpers) => {
    const queryClientVariables = new Set<string>()

    function reportInlineQueryOptions(node: TSESTree.Node): void {
      if (ASTUtils.isObjectExpression(node) && hasInlineQueryOptions(node)) {
        context.report({
          node,
          messageId: 'preferQueryOptions',
        })
      }
    }

    function reportInlineFilterQueryKey(node: TSESTree.Node): void {
      if (ASTUtils.isObjectExpression(node) && hasInlineFilterQueryKey(node)) {
        context.report({
          node,
          messageId: 'preferQueryOptionsQueryKey',
        })
      }
    }

    return {
      VariableDeclarator: (node) => {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.init !== null &&
          isTanstackQueryClient(node.init, helpers, queryClientVariables)
        ) {
          queryClientVariables.add(node.id.name)
        }
      },

      CallExpression: (node) => {
        if (
          ASTUtils.isIdentifierWithOneOfNames(node.callee, queryOptionsBuilders)
        ) {
          return
        }

        if (
          ASTUtils.isIdentifier(node.callee) &&
          helpers.isTanstackQueryImport(node.callee)
        ) {
          const options = node.arguments[0]

          if (options === undefined) {
            return
          }

          if (ASTUtils.isIdentifierWithOneOfNames(node.callee, queryHooks)) {
            reportInlineQueryOptions(options)
            return
          }

          if (
            ASTUtils.isIdentifierWithOneOfNames(node.callee, queriesHooks) &&
            ASTUtils.isObjectExpression(options)
          ) {
            const queries = ASTUtils.findPropertyWithIdentifierKey(
              options.properties,
              'queries',
            )?.value

            if (queries !== undefined) {
              getQueryObjects(queries).forEach((query) => {
                reportInlineQueryOptions(query)
              })
            }

            return
          }

          if (ASTUtils.isIdentifierWithOneOfNames(node.callee, filterHooks)) {
            reportInlineFilterQueryKey(options)
          }

          return
        }

        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          !ASTUtils.isIdentifier(node.callee.property) ||
          !isTanstackQueryClient(
            node.callee.object,
            helpers,
            queryClientVariables,
          )
        ) {
          return
        }

        const method = node.callee.property.name
        const options = node.arguments[0]

        if (options === undefined) {
          return
        }

        if (queryClientOptionMethods.includes(method)) {
          reportInlineQueryOptions(options)
          return
        }

        if (
          queryClientQueryKeyMethods.includes(method) &&
          options.type === AST_NODE_TYPES.ArrayExpression
        ) {
          context.report({
            node: options,
            messageId: 'preferQueryOptionsQueryKey',
          })
          return
        }

        if (queryClientFilterMethods.includes(method)) {
          reportInlineFilterQueryKey(options)
        }
      },
    }
  }),
})

function hasInlineQueryOptions(node: TSESTree.ObjectExpression): boolean {
  return (
    ASTUtils.findPropertyWithIdentifierKey(node.properties, 'queryKey') !==
      undefined ||
    ASTUtils.findPropertyWithIdentifierKey(node.properties, 'queryFn') !==
      undefined
  )
}

function hasInlineFilterQueryKey(node: TSESTree.ObjectExpression): boolean {
  return (
    ASTUtils.findPropertyWithIdentifierKey(node.properties, 'queryKey')?.value
      .type === AST_NODE_TYPES.ArrayExpression
  )
}

function getReturnedObjectExpressions(
  node: TSESTree.Node,
): Array<TSESTree.ObjectExpression> {
  if (ASTUtils.isObjectExpression(node)) {
    return [node]
  }

  if (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression
  ) {
    return getReturnedObjectExpressions(node.body)
  }

  if (node.type === AST_NODE_TYPES.BlockStatement) {
    return node.body.flatMap((statement) => {
      if (
        statement.type === AST_NODE_TYPES.ReturnStatement &&
        statement.argument !== null
      ) {
        return getReturnedObjectExpressions(statement.argument)
      }

      return []
    })
  }

  if (node.type === AST_NODE_TYPES.ConditionalExpression) {
    return [
      ...getReturnedObjectExpressions(node.consequent),
      ...getReturnedObjectExpressions(node.alternate),
    ]
  }

  if (node.type === AST_NODE_TYPES.LogicalExpression) {
    return [
      ...getReturnedObjectExpressions(node.left),
      ...getReturnedObjectExpressions(node.right),
    ]
  }

  if (node.type === AST_NODE_TYPES.SequenceExpression) {
    return node.expressions.flatMap((expression) =>
      getReturnedObjectExpressions(expression),
    )
  }

  return []
}

function getQueryObjects(
  node: TSESTree.Node,
): Array<TSESTree.ObjectExpression> {
  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    return node.elements.flatMap((element) => {
      if (element !== null && ASTUtils.isObjectExpression(element)) {
        return [element]
      }

      return []
    })
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    ASTUtils.isIdentifierWithName(node.callee.property, 'map')
  ) {
    const mapper = node.arguments[0]

    if (
      mapper?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      mapper?.type === AST_NODE_TYPES.FunctionExpression
    ) {
      return getReturnedObjectExpressions(mapper)
    }
  }

  return []
}

function isTanstackQueryClient(
  node: TSESTree.Node,
  helpers: {
    isTanstackQueryImport: (node: TSESTree.Identifier) => boolean
  },
  queryClientVariables: Set<string>,
): boolean {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return queryClientVariables.has(node.name)
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    ASTUtils.isIdentifierWithName(node.callee, 'useQueryClient')
  ) {
    return helpers.isTanstackQueryImport(node.callee)
  }

  if (
    node.type === AST_NODE_TYPES.NewExpression &&
    ASTUtils.isIdentifierWithName(node.callee, 'QueryClient')
  ) {
    return helpers.isTanstackQueryImport(node.callee)
  }

  if (node.type === AST_NODE_TYPES.ChainExpression) {
    return isTanstackQueryClient(node.expression, helpers, queryClientVariables)
  }

  return false
}
