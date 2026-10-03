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
    const trackedVariables: Record<string, string> = Object.create(null)
    const trackedCustomHooks: Record<string, string> = Object.create(null)
    const hookAliasMap: Record<string, string> = Object.create(null)
    const pendingVariableDeclarators: Array<TSESTree.VariableDeclarator> = []
    const pendingDependencyChecks: Array<{
      reactHook: string
      depsArray: TSESTree.ArrayExpression
    }> = []

    /**
     * Returns the name of the React hook a call expression calls, if it is one: a known hook, an
     * alias of one, or `React.<hook>`.
     * @param node - The call expression.
     * @returns The hook name, or `undefined` if the call is not a React hook.
     */
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

    /**
     * Tracks the variables bound to a query hook's result, so they can be reported when used as
     * dependencies.
     * @param pattern - The binding: an identifier, or an array pattern whose elements and rest
     * element are tracked.
     * @param queryHook - The name of the query hook the result comes from.
     */
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

    /**
     * Checks whether a name follows the custom hook naming convention.
     * @param hookName - The name to check.
     * @returns `true` if the name starts with `use` followed by an uppercase letter or a digit.
     */
    function isCustomHookName(hookName: string): boolean {
      return /^use[A-Z0-9]/.test(hookName)
    }

    /**
     * Checks whether a call passes an object literal with a `combine` property as its first argument.
     * @param callExpression - The call expression to check.
     * @returns `true` if the first argument has a `combine` property.
     */
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

    /**
     * Returns the name of the TanStack Query hook a call expression calls directly. `useQueries` and
     * `useSuspenseQueries` with `combine` are ignored, since their result can be stable.
     * @param callExpression - The call expression.
     * @returns The hook name, or `undefined` if the call is not a tracked query hook.
     */
    function getDirectQueryHook(
      callExpression: TSESTree.CallExpression,
    ): string | undefined {
      if (
        callExpression.callee.type !== AST_NODE_TYPES.Identifier ||
        !allHookNames.includes(callExpression.callee.name) ||
        !helpers.isTanstackQueryImport(callExpression.callee)
      ) {
        return undefined
      }

      if (
        (callExpression.callee.name === 'useQueries' ||
          callExpression.callee.name === 'useSuspenseQueries') &&
        hasCombineProperty(callExpression)
      ) {
        return undefined
      }

      return callExpression.callee.name
    }

    /**
     * Returns the query hook behind a call expression: a direct query hook call, or a custom hook that
     * returns one.
     * @param callExpression - The call expression.
     * @returns The query hook name, or `undefined` if there is none.
     */
    function getTrackedQueryHook(
      callExpression: TSESTree.CallExpression,
    ): string | undefined {
      const directQueryHook = getDirectQueryHook(callExpression)
      if (directQueryHook !== undefined) {
        return directQueryHook
      }

      if (callExpression.callee.type === AST_NODE_TYPES.Identifier) {
        return trackedCustomHooks[callExpression.callee.name]
      }

      return undefined
    }

    /**
     * Returns the query hook that a custom hook's body returns: either an expression body that calls
     * one, or a block with a single `return` of such a call.
     * @param body - The body of the custom hook.
     * @returns The query hook name, or `undefined` if the body doesn't return one.
     */
    function getReturnedQueryHook(
      body:
        | TSESTree.FunctionExpression['body']
        | TSESTree.ArrowFunctionExpression['body'],
    ): string | undefined {
      if (body.type === AST_NODE_TYPES.CallExpression) {
        return getDirectQueryHook(body)
      }

      if (body.type !== AST_NODE_TYPES.BlockStatement) {
        return undefined
      }

      const returnStatements = body.body.filter(
        (statement): statement is TSESTree.ReturnStatement =>
          statement.type === AST_NODE_TYPES.ReturnStatement,
      )
      if (returnStatements.length !== 1) {
        return undefined
      }

      const returnArgument = returnStatements[0]?.argument
      if (returnArgument?.type === AST_NODE_TYPES.CallExpression) {
        return getDirectQueryHook(returnArgument)
      }

      return undefined
    }

    /**
     * Reports the tracked query results used in a React hook's dependency array.
     * @param reactHook - The name of the React hook.
     * @param depsArray - The dependency array to check.
     */
    function checkDependencyArray(
      reactHook: string,
      depsArray: TSESTree.ArrayExpression,
    ) {
      depsArray.elements.forEach((dep) => {
        if (
          dep !== null &&
          dep.type === AST_NODE_TYPES.Identifier &&
          trackedVariables[dep.name] !== undefined
        ) {
          const queryHook = trackedVariables[dep.name]
          context.report({
            node: dep,
            messageId: 'noUnstableDeps',
            data: {
              queryHook,
              reactHook,
            },
          })
        }
      })
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

      FunctionDeclaration(node) {
        if (node.id === null || !isCustomHookName(node.id.name)) {
          return
        }

        const queryHook = getReturnedQueryHook(node.body)
        if (queryHook !== undefined) {
          trackedCustomHooks[node.id.name] = queryHook
        }
      },

      VariableDeclarator(node) {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          isCustomHookName(node.id.name) &&
          node.init !== null &&
          (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            node.init.type === AST_NODE_TYPES.FunctionExpression)
        ) {
          const queryHook = getReturnedQueryHook(node.init.body)
          if (queryHook !== undefined) {
            trackedCustomHooks[node.id.name] = queryHook
          }
        }

        if (
          node.init !== null &&
          node.init.type === AST_NODE_TYPES.CallExpression
        ) {
          pendingVariableDeclarators.push(node)
        }
      },
      CallExpression: (node) => {
        const reactHook = getReactHook(node)
        if (
          reactHook !== undefined &&
          node.arguments.length > 1 &&
          node.arguments[1]?.type === AST_NODE_TYPES.ArrayExpression
        ) {
          pendingDependencyChecks.push({
            reactHook,
            depsArray: node.arguments[1],
          })
        }
      },
      'Program:exit'() {
        pendingVariableDeclarators.forEach((node) => {
          if (node.init?.type !== AST_NODE_TYPES.CallExpression) {
            return
          }

          const queryHook = getTrackedQueryHook(node.init)
          if (queryHook !== undefined) {
            collectVariableNames(node.id, queryHook)
          }
        })

        pendingDependencyChecks.forEach(({ reactHook, depsArray }) => {
          checkDependencyArray(reactHook, depsArray)
        })
      },
    }
  }),
})
