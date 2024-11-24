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

  create: detectTanstackQueryImports((context) => {
    const trackedVariables: Record<string, string> = {}
    const hookAliasMap: Record<string, string> = {}

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
      }
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

      VariableDeclarator(node) {
        if (
          node.init !== null &&
          node.init.type === AST_NODE_TYPES.CallExpression &&
          node.init.callee.type === AST_NODE_TYPES.Identifier &&
          allHookNames.includes(node.init.callee.name)
        ) {
          collectVariableNames(node.id, node.init.callee.name)
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
      },
    }
  }),
})
