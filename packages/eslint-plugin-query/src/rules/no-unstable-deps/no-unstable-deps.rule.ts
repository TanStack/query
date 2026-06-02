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
    const trackedCustomHooks: Record<string, string> = {}
    const hookAliasMap: Record<string, string> = {}
    const pendingVariableDeclarators: Array<TSESTree.VariableDeclarator> = []
    const pendingDependencyChecks: Array<{
      reactHook: string
      depsArray: TSESTree.ArrayExpression
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

    function isCustomHookName(hookName: string): boolean {
      return /^use[A-Z0-9]/.test(hookName)
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
