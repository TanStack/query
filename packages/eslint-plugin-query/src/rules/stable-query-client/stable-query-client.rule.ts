import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { createRule } from '../../utils/create-rule'
import type { TSESLint } from '@typescript-eslint/utils'

export const name = 'stable-query-client'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Makes sure that QueryClient is stable',
      recommended: 'error',
    },
    messages: {
      unstable: [
        'QueryClient is not stable. It should be either extracted from the component or wrapped in React.useState.',
        'See https://tkdodo.eu/blog/react-query-fa-qs#2-the-queryclient-is-not-stable',
      ].join('\n'),
      fixTo: 'Fix to {{result}}',
    },
    hasSuggestions: true,
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],

  create(context, _, helpers) {
    return {
      NewExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'QueryClient' ||
          node.parent?.type !== AST_NODE_TYPES.VariableDeclarator ||
          !helpers.isSpecificTanstackQueryImport(
            node.callee,
            '@tanstack/react-query',
          )
        ) {
          return
        }

        const fnAncestor = ASTUtils.getFunctionAncestor(context)
        const isReactServerComponent = fnAncestor?.async === true

        if (
          !ASTUtils.isValidReactComponentOrHookName(fnAncestor?.id) ||
          isReactServerComponent
        ) {
          return
        }

        context.report({
          node: node.parent,
          messageId: 'unstable',
          fix: (() => {
            const { parent } = node

            if (parent.id.type !== AST_NODE_TYPES.Identifier) {
              return
            }

            const nodeText = context.getSourceCode().getText(node)
            const variableName = parent.id.name

            return (fixer: TSESLint.RuleFixer) => {
              return fixer.replaceTextRange(
                [parent.range[0], parent.range[1]],
                `[${variableName}] = React.useState(() => ${nodeText})`,
              )
            }
          })(),
        })
      },
    }
  },
})
