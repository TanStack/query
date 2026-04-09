import { createRule } from '../utils'
import type { TSESTree } from '@typescript-eslint/utils'

export const noRestDestructuring = createRule<[], 'noRestDestructuring'>({
  name: 'no-rest-destructuring',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow rest destructuring of query results',
      url: 'https://tanstack.com/query/latest/docs/eslint/no-rest-destructuring',
    },
    messages: {
      noRestDestructuring:
        'Destructuring the result of a query hook with a rest parameter can cause unexpected behavior. Instead, destructure the result into a variable first, then destructure the variable.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const parserServices =
      context.sourceCode?.parserServices ?? context.parserServices

    function isTanstackQueryResult(node: TSESTree.Node): boolean {
      if (!parserServices?.hasTypeInformation) {
        return false
      }

      const checker = parserServices.program.getTypeChecker()
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
      if (!tsNode) return false

      const type = checker.getTypeAtLocation(tsNode)
      const symbol = type.symbol || type.aliasSymbol
      if (!symbol) return false

      const typeName = symbol.escapedName.toString()

      const queryResultTypes = [
        'UseQueryResult',
        'UseInfiniteQueryResult',
        'QueryObserverResult',
        'InfiniteQueryObserverResult',
        'UseBaseQueryResult',
      ]

      if (queryResultTypes.some((t) => typeName.includes(t))) {
        return true
      }

      const declarations = symbol.declarations || []
      for (const decl of declarations) {
        const fileName = decl.getSourceFile().fileName
        if (fileName.includes('@tanstack') && fileName.includes('query')) {
          return true
        }
      }

      return false
    }

    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        if (node.id.type !== 'ObjectPattern') return

        const hasRest = node.id.properties.some(
          (prop) => prop.type === 'RestElement',
        )

        if (!hasRest) return

        const init = node.init

        if (!init || init.type !== 'CallExpression') return

        const callee = init.callee

        let isQueryHook = false

        if (callee.type === 'Identifier' && callee.name.startsWith('use')) {
          const name = callee.name
          if (['useQuery', 'useInfiniteQuery'].includes(name)) {
            isQueryHook = true
          } else if (parserServices?.hasTypeInformation) {
            isQueryHook = isTanstackQueryResult(init)
          }
        }

        if (isQueryHook) {
          context.report({
            node,
            messageId: 'noRestDestructuring',
          })
        }
      },
    }
  },
})
