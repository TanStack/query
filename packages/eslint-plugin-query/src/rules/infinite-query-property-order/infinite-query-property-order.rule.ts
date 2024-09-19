import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { sortDataByOrder } from './infinite-query-property-order.utils'
import { checkedProperties, infiniteQueryFunctions } from './constants'
import type { InfiniteQueryFunctions } from './constants'
import type { ExtraRuleDocs } from '../../types'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

const infiniteQueryFunctionsSet = new Set(infiniteQueryFunctions)
function isInfiniteQueryFunction(node: any): node is InfiniteQueryFunctions {
  return infiniteQueryFunctionsSet.has(node)
}

export const name = 'infinite-query-property-order'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure correct order of inference sensitive properties for infinite queries',
      recommended: 'error',
    },
    messages: {
      invalidOrder: 'Invalid order of properties for `{{function}}`.',
    },
    schema: [],
    hasSuggestions: true,
    fixable: 'code',
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context) => {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return
        }
        const infiniteQueryFunction = node.callee.name
        if (!isInfiniteQueryFunction(infiniteQueryFunction)) {
          return
        }
        const argument = node.arguments[0]
        if (argument === undefined || argument.type !== 'ObjectExpression') {
          return
        }

        const allProperties = argument.properties
        if (allProperties.length < 2) {
          return
        }

        const properties = allProperties.flatMap((p) => {
          if (
            p.type === AST_NODE_TYPES.Property &&
            p.key.type === AST_NODE_TYPES.Identifier
          ) {
            return { name: p.key.name, property: p }
          } else if (p.type === AST_NODE_TYPES.SpreadElement) {
            if (p.argument.type === AST_NODE_TYPES.Identifier) {
              return { name: p.argument.name, property: p }
            } else {
              throw new Error('Unsupported spread element')
            }
          }
          return []
        })

        const sortedProperties = sortDataByOrder(
          properties,
          checkedProperties,
          'name',
        )
        if (sortedProperties === null) {
          return
        }
        context.report({
          node: argument,
          data: { function: node.callee.name },
          messageId: 'invalidOrder',
          fix(fixer) {
            const sourceCode = context.sourceCode

            const text = sortedProperties.reduce(
              (sourceText, specifier, index) => {
                let text = ''
                if (index < allProperties.length - 1) {
                  text = sourceCode
                    .getText()
                    .slice(
                      allProperties[index]!.range[1],
                      allProperties[index + 1]!.range[0],
                    )
                }
                return (
                  sourceText + sourceCode.getText(specifier.property) + text
                )
              },
              '',
            )
            return fixer.replaceTextRange(
              [allProperties[0]!.range[0], allProperties.at(-1)!.range[1]],
              text,
            )
          },
        })
      },
    }
  }),
})
