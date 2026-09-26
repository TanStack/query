import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { getDocsUrl } from '../../utils/get-docs-url'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
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
type Helpers = {
  isTanstackQueryImport: (node: TSESTree.Identifier) => boolean
}

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
      CallExpression: (node) => {
        if (ASTUtils.isIdentifier(node.callee)) {
          const importedName = getTanstackImportName(
            context,
            helpers,
            node.callee,
          )

          if (importedName === null) {
            return
          }

          if (queryOptionsBuilders.includes(importedName)) {
            return
          }

          const options = node.arguments[0]

          if (options === undefined) {
            return
          }

          if (queryHooks.includes(importedName)) {
            reportInlineQueryOptions(options)
            return
          }

          if (
            queriesHooks.includes(importedName) &&
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

          if (filterHooks.includes(importedName)) {
            reportInlineFilterQueryKey(options)
          }

          return
        }

        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          !ASTUtils.isIdentifier(node.callee.property) ||
          !isTanstackQueryClient(node.callee.object, context, helpers)
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
          isInlineArrayExpression(options)
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
  const queryKey = ASTUtils.findPropertyWithIdentifierKey(
    node.properties,
    'queryKey',
  )?.value

  return queryKey !== undefined && isInlineArrayExpression(queryKey)
}

function isInlineArrayExpression(node: TSESTree.Node): boolean {
  return unwrapTypeAssertions(node).type === AST_NODE_TYPES.ArrayExpression
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
  context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>,
  helpers: Helpers,
): boolean {
  const source = resolveQueryClientSource(node, context)

  if (
    source.type === AST_NODE_TYPES.CallExpression &&
    ASTUtils.isIdentifier(source.callee)
  ) {
    return (
      getTanstackImportName(context, helpers, source.callee) ===
      'useQueryClient'
    )
  }

  if (
    source.type === AST_NODE_TYPES.NewExpression &&
    ASTUtils.isIdentifier(source.callee)
  ) {
    return (
      getTanstackImportName(context, helpers, source.callee) === 'QueryClient'
    )
  }

  return false
}

function getTanstackImportName(
  context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>,
  helpers: Helpers,
  node: TSESTree.Identifier,
): string | null {
  if (!helpers.isTanstackQueryImport(node)) {
    return null
  }

  const definition = context.sourceCode
    .getScope(node)
    .references.find((reference) => reference.identifier === node)?.resolved
    ?.defs[0]?.node

  if (
    definition?.type !== AST_NODE_TYPES.ImportSpecifier ||
    definition.imported.type !== AST_NODE_TYPES.Identifier
  ) {
    return null
  }

  return definition.imported.name
}

function resolveQueryClientSource(
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>,
): TSESTree.Node {
  const visitedNodes = new Set<TSESTree.Node>()

  while (!visitedNodes.has(node)) {
    visitedNodes.add(node)

    if (node.type === AST_NODE_TYPES.ChainExpression) {
      node = node.expression
      continue
    }

    node = unwrapTypeAssertions(node)

    if (node.type !== AST_NODE_TYPES.Identifier) {
      return node
    }

    const expression = ASTUtils.getReferencedExpressionByIdentifier({
      context,
      node,
    })

    if (expression === null) {
      return node
    }

    node = expression
  }

  return node
}

function unwrapTypeAssertions(node: TSESTree.Node): TSESTree.Node {
  while (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    node = node.expression
  }

  return node
}
