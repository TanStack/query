import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { sortDataByOrder } from './mutation-property-order.utils'
import { mutationFunctions, sortRules } from './constants'
import type { MutationFunctions } from './constants'
import type { ExtraRuleDocs } from '../../types'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

const mutationFunctionsSet = new Set(mutationFunctions)
function isMutationFunction(node: any): node is MutationFunctions {
  return mutationFunctionsSet.has(node)
}

export const name = 'mutation-property-order'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure correct order of inference-sensitive properties in useMutation()',
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
        const mutationFunction = node.callee.name
        if (!isMutationFunction(mutationFunction)) {
          return
        }
        const argument = node.arguments[0]
        if (argument === undefined || argument.type !== 'ObjectExpression') {
          return
        }

        const allProperties = argument.properties

        // no need to sort if there is at max 1 property
        if (allProperties.length < 2) {
          return
        }

        const properties = allProperties.flatMap((p, index) => {
          if (
            p.type === AST_NODE_TYPES.Property &&
            p.key.type === AST_NODE_TYPES.Identifier
          ) {
            return { name: p.key.name, property: p }
          } else return { name: `_property_${index}`, property: p }
        })

        const sortedProperties = sortDataByOrder(properties, sortRules, 'name')
        if (sortedProperties === null) {
          return
        }

        context.report({
          node: argument,
          data: { function: node.callee.name },
          messageId: 'invalidOrder',
          fix(fixer) {
            const sourceCode = context.sourceCode

            const reorderedText = sortedProperties.reduce(
              (sourceText, specifier, index) => {
                let textBetweenProperties = ''
                if (index < allProperties.length - 1) {
                  textBetweenProperties = sourceCode
                    .getText()
                    .slice(
                      allProperties[index]!.range[1],
                      allProperties[index + 1]!.range[0],
                    )
                }
                return (
                  sourceText +
                  sourceCode.getText(specifier.property) +
                  textBetweenProperties
                )
              },
              '',
            )
            return fixer.replaceTextRange(
              [allProperties[0]!.range[0], allProperties.at(-1)!.range[1]],
              reorderedText,
            )
          },
        })
      },
    }
  }),
})
