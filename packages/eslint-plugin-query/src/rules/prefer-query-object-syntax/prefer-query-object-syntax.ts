import type { TSESLint } from '@typescript-eslint/utils'
import { createRule } from '../../utils/create-rule'
import { ASTUtils } from '../../utils/ast-utils'

const QUERY_CALLS = ['useQuery', 'createQuery']

export const name = 'prefer-query-object-syntax'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prefer object syntax for useQuery',
      recommended: 'error',
    },
    messages: {
      preferObjectSyntax: `Objects syntax for useQuery is preferred`,
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],

  create(context, _, helpers) {
    const sourceCode = context.getSourceCode()
    return {
      CallExpression(node) {
        const isUseQuery =
          node.callee.type === 'Identifier' &&
          QUERY_CALLS.includes(node.callee.name) &&
          helpers.isReactQueryImport(node.callee)
        if (!isUseQuery) {
          return
        }

        const firstArgument = node.arguments[0]
        if (!firstArgument) {
          return
        }

        const hasFirstObjectArgument = firstArgument.type === 'ObjectExpression'
        if (hasFirstObjectArgument) {
          return
        }

        const secondArgument = node.arguments[1]
        const thirdArgument = node.arguments[2]

        const optionsObject =
          secondArgument?.type === 'ObjectExpression'
            ? secondArgument
            : thirdArgument?.type === 'ObjectExpression'
            ? thirdArgument
            : undefined

        if (
          secondArgument &&
          !thirdArgument &&
          secondArgument !== optionsObject &&
          secondArgument.type === 'Identifier'
        ) {
          // Unable to determine if the secondArgument identifier is the options object or query fn.
          // User has to fix the code manually.
          context.report({ node, messageId: 'preferObjectSyntax' })
          return
        }

        context.report({
          node,
          messageId: 'preferObjectSyntax',
          fix(fixer) {
            const ruleFixes: TSESLint.RuleFix[] = []
            const optionsObjectProperties: string[] = []

            // queryKey
            const queryKey = sourceCode.getText(firstArgument)
            const queryKeyProperty =
              queryKey === 'queryKey' ? 'queryKey' : `queryKey: ${queryKey}`
            optionsObjectProperties.push(queryKeyProperty)

            // queryFn
            if (secondArgument && secondArgument !== optionsObject) {
              const queryFn = sourceCode.getText(secondArgument)
              const queryFnProperty =
                queryFn === 'queryFn' ? 'queryFn' : `queryFn: ${queryFn}`
              optionsObjectProperties.push(queryFnProperty)
            }

            // options
            if (optionsObject) {
              const existingObjectProperties = optionsObject.properties.map(
                (objectLiteral) => {
                  return sourceCode.getText(objectLiteral)
                },
              )
              optionsObjectProperties.push(...existingObjectProperties)
            }

            const argumentsRange = ASTUtils.getRangeOfArguments(node)
            if (argumentsRange) {
              ruleFixes.push(fixer.removeRange(argumentsRange))
            }

            ruleFixes.push(
              fixer.insertTextAfterRange(
                [node.range[0], node.range[1] - 1],
                `{ ${optionsObjectProperties.join(', ')} }`,
              ),
            )

            return ruleFixes
          },
        })
      },
    }
  },
})
