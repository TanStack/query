import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

import { getDocsUrl } from './get-docs-url'
import { detectTanstackQueryImports } from './detect-react-query-imports'
import { sortDataByOrder } from './sort-data-by-order'
import type { ExtraRuleDocs } from '../types'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export function createPropertyOrderRule<
  TFunc extends string,
  TProp extends string,
>(
  options: Omit<Parameters<typeof createRule>[0], 'create'>,
  targetFunctions: ReadonlyArray<TFunc> | Array<TFunc>,
  orderRules: ReadonlyArray<
    Readonly<[ReadonlyArray<TProp>, ReadonlyArray<TProp>]>
  >,
) {
  const targetFunctionSet = new Set(targetFunctions)
  function isTargetFunction(node: any): node is TFunc {
    return targetFunctionSet.has(node)
  }

  return createRule({
    ...options,
    create: detectTanstackQueryImports((context) => {
      return {
        CallExpression(node) {
          if (node.callee.type !== AST_NODE_TYPES.Identifier) {
            return
          }
          const functions = node.callee.name
          if (!isTargetFunction(functions)) {
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

          const sortedProperties = sortDataByOrder(
            properties,
            orderRules,
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
}
