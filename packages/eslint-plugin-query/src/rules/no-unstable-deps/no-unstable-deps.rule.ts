import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'no-unstable-deps'

export const reactHookNames = ['useEffect', 'useCallback', 'useMemo']
export const useQueryHookNames = [
  'useQuery',
  'useSuspenseQuery',
  'useQueries',
  'useSuspenseQueries',
  'useInfiniteQuery',
  'useSuspenseInfiniteQuery',
]
const allHookNames = ['useMutation', ...useQueryHookNames]
const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow putting the result of query hooks directly in a React hook dependency array',
      recommended: 'error',
    },
    messages: {
      noUnstableDeps: `The result of {{queryHook}} is not referentially stable, so don't pass it directly into the dependencies array of {{reactHook}}. Instead, destructure the return value of {{queryHook}} and pass the destructured values into the dependency array of {{reactHook}}.`,
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _options, helpers) => {
    const trackedVariables: Record<string, string> = {}
    const hookAliasMap: Record<string, string> = {}
    const trackedCustomHooks: Record<string, string> = {}
    const pendingCustomHookAssignments: Array<{
      id: TSESTree.BindingName
      calleeName: string
    }> = []
    const reactHookDependencies: Array<{
      node: TSESTree.Identifier
      reactHook: string
    }> = []

    function getReactHook(node: TSESTree.CallExpression): string | undefined {
      if (node.callee.type === 'Identifier') {
        const calleeName = node.callee.name
        // Check if the identifier is a known React hook or an alias
        if (reactHookNames.includes(calleeName) || calleeName in hookAliasMap) {
          return calleeName
        }
      } else if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'React' &&
        node.callee.property.type === 'Identifier' &&
        reactHookNames.includes(node.callee.property.name)
      ) {
        // Member expression case: `React.useCallback`
        return node.callee.property.name
      }
      return undefined
    }

    function collectVariableNames(
      pattern: TSESTree.BindingName,
      queryHook: string,
    ) {
      if (pattern.type === AST_NODE_TYPES.Identifier) {
        trackedVariables[pattern.name] = queryHook
      } else if (pattern.type === AST_NODE_TYPES.ArrayPattern) {
        for (const element of pattern.elements) {
          if (element === null) {
            continue
          }
          if (element.type === AST_NODE_TYPES.Identifier) {
            trackedVariables[element.name] = queryHook
          } else if (
            element.type === AST_NODE_TYPES.RestElement &&
            element.argument.type === AST_NODE_TYPES.Identifier
          ) {
            trackedVariables[element.argument.name] = queryHook
          }
        }
      }
    }

    function hasCombineProperty(
      callExpression: TSESTree.CallExpression,
    ): boolean {
      if (callExpression.arguments.length === 0) return false

      const firstArg = callExpression.arguments[0]
      if (!firstArg || firstArg.type !== AST_NODE_TYPES.ObjectExpression)
        return false

      return firstArg.properties.some(
        (prop) =>
          prop.type === AST_NODE_TYPES.Property &&
          prop.key.type === AST_NODE_TYPES.Identifier &&
          prop.key.name === 'combine',
      )
    }

    function getReturnedHookName(
      expression: TSESTree.Expression,
    ): string | undefined {
      if (expression.type === AST_NODE_TYPES.ParenthesizedExpression) {
        return getReturnedHookName(expression.expression)
      }

      if (expression.type !== AST_NODE_TYPES.CallExpression) {
        return undefined
      }

      if (
        expression.callee.type !== AST_NODE_TYPES.Identifier ||
        !expression.callee.name.startsWith('use') ||
        !helpers.isTanstackQueryImport(expression.callee)
      ) {
        return undefined
      }

      return expression.callee.name
    }

    function getFunctionReturnedHookName(
      node:
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression,
    ): string | undefined {
      const returnedNode =
        node.body.type === AST_NODE_TYPES.BlockStatement
          ? node.body.body.find(
              (statement) =>
                statement.type === AST_NODE_TYPES.ReturnStatement &&
                statement.argument !== null,
            )?.argument
          : node.body

      if (!returnedNode) {
        return undefined
      }

      return getReturnedHookName(returnedNode)
    }

    function resolveTrackedHook(
      calleeName: string,
      visited: Set<string> = new Set(),
    ): string | undefined {
      if (allHookNames.includes(calleeName)) {
        return calleeName
      }

      if (visited.has(calleeName)) {
        return undefined
      }

      const nestedHookName = trackedCustomHooks[calleeName]
      if (!nestedHookName) {
        return undefined
      }

      visited.add(calleeName)
      return resolveTrackedHook(nestedHookName, visited)
    }

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (
          node.specifiers.length > 0 &&
          node.importKind === 'value' &&
          node.source.value === 'React'
        ) {
          node.specifiers.forEach((specifier) => {
            if (
              specifier.type === AST_NODE_TYPES.ImportSpecifier &&
              specifier.imported.type === AST_NODE_TYPES.Identifier &&
              reactHookNames.includes(specifier.imported.name)
            ) {
              // Track alias or direct import
              hookAliasMap[specifier.local.name] = specifier.imported.name
            }
          })
        }
      },

      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (!node.id || node.id.type !== AST_NODE_TYPES.Identifier) {
          return
        }

        const returnedHookName = getFunctionReturnedHookName(node)
        if (!returnedHookName) {
          return
        }

        trackedCustomHooks[node.id.name] = returnedHookName
      },

      VariableDeclarator(node) {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.id.name.startsWith('use') &&
          node.init !== null &&
          (node.init.type === AST_NODE_TYPES.FunctionExpression ||
            node.init.type === AST_NODE_TYPES.ArrowFunctionExpression)
        ) {
          const returnedHookName = getFunctionReturnedHookName(node.init)
          if (!returnedHookName) {
            return
          }

          trackedCustomHooks[node.id.name] = returnedHookName
        }

        if (
          node.init?.type !== AST_NODE_TYPES.CallExpression ||
          node.init.callee.type !== AST_NODE_TYPES.Identifier ||
          !node.init.callee.name.startsWith('use')
        ) {
          return
        }

        const calleeName = node.init.callee.name
        const resolvedQueryHook = resolveTrackedHook(calleeName)

        if (allHookNames.includes(calleeName)) {
          if (!helpers.isTanstackQueryImport(node.init.callee)) {
            return
          }

          if (
            (calleeName === 'useQueries' ||
              calleeName === 'useSuspenseQueries') &&
            hasCombineProperty(node.init)
          ) {
            return
          }

          collectVariableNames(node.id, calleeName)
          return
        }

        if (resolvedQueryHook) {
          pendingCustomHookAssignments.push({ id: node.id, calleeName })
        }
      },
      CallExpression: (node) => {
        const reactHook = getReactHook(node)
        if (
          reactHook !== undefined &&
          node.arguments.length > 1 &&
          node.arguments[1]?.type === AST_NODE_TYPES.ArrayExpression
        ) {
          const depsArray = node.arguments[1].elements
          depsArray.forEach((dep) => {
            if (dep !== null && dep.type === AST_NODE_TYPES.Identifier) {
              reactHookDependencies.push({ node: dep, reactHook })
            }
          })
        }
      },

      'Program:exit'() {
        pendingCustomHookAssignments.forEach(({ id, calleeName }) => {
          const queryHook = resolveTrackedHook(calleeName)
          if (!queryHook) {
            return
          }

          collectVariableNames(id, queryHook)
        })

        reactHookDependencies.forEach(({ node, reactHook }) => {
          const queryHook = trackedVariables[node.name]

          if (!queryHook) {
            return
          }

          context.report({
            node,
            messageId: 'noUnstableDeps',
            data: {
              queryHook,
              reactHook,
            },
          })
        })
      },
    }
  }),
})
