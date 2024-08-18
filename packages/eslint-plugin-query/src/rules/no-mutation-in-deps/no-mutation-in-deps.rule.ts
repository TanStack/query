import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'no-mutation-in-deps'

export const reactHookNames = ['useEffect', 'useCallback', 'useMemo']

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow putting the result of useMutation directly in a React hook dependency array',
      recommended: 'error',
    },
    messages: {
      mutationInDeps: `The result of useMutation is not referentially stable, so don't pass it directly into the dependencies array of a hook like useEffect, useMemo, or useCallback. Instead, destructure the return value of useMutation and pass the destructured values into the dependency array.`,
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context) => {
    const trackedVariables = new Set<string>()
    const hookAliasMap: Record<string, string> = {}

    function isReactHook(node: TSESTree.CallExpression): boolean {
      if (node.callee.type === 'Identifier') {
        const calleeName = node.callee.name
        // Check if the identifier is a known React hook or an alias
        return reactHookNames.includes(calleeName) || calleeName in hookAliasMap
      } else if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'React' &&
        node.callee.property.type === 'Identifier' &&
        reactHookNames.includes(node.callee.property.name)
      ) {
        // Member expression case: `React.useCallback`
        return true
      }
      return false
    }

    function collectVariableNames(pattern: TSESTree.BindingName) {
      if (pattern.type === AST_NODE_TYPES.Identifier) {
        trackedVariables.add(pattern.name)
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
          node.init.callee.name === 'useMutation'
        ) {
          collectVariableNames(node.id)
        }
      },
      CallExpression: (node) => {
        if (
          isReactHook(node) &&
          node.arguments.length > 1 &&
          node.arguments[1]?.type === AST_NODE_TYPES.ArrayExpression
        ) {
          const depsArray = node.arguments[1].elements
          depsArray.forEach((dep) => {
            if (
              dep !== null &&
              dep.type === AST_NODE_TYPES.Identifier &&
              trackedVariables.has(dep.name)
            ) {
              context.report({
                node: dep,
                messageId: 'mutationInDeps',
              })
            }
          })
        }
      },
    }
  }),
})
