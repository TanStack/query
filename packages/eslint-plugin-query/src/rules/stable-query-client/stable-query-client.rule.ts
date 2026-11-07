import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import type { TSESLint } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'stable-query-client'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

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

  create: detectTanstackQueryImports((context, _, helpers) => {
    return {
      NewExpression: (node) => {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'QueryClient' ||
          !helpers.isSpecificTanstackQueryImport(
            node.callee,
            '@tanstack/react-query',
          )
        ) {
          return
        }

        const fnAncestor = context.sourceCode
          .getAncestors(node)
          .reverse()
          .find((ancestor) =>
            ASTUtils.isNodeOfOneOf(ancestor, [
              AST_NODE_TYPES.FunctionDeclaration,
              AST_NODE_TYPES.FunctionExpression,
              AST_NODE_TYPES.ArrowFunctionExpression,
            ]),
          )
        const fnName =
          fnAncestor?.parent.type === AST_NODE_TYPES.VariableDeclarator &&
          fnAncestor.parent.id.type === AST_NODE_TYPES.Identifier
            ? fnAncestor.parent.id
            : fnAncestor?.id
        const isReactServerComponent = fnAncestor?.async === true

        if (
          !ASTUtils.isValidReactComponentOrHookName(fnName) ||
          isReactServerComponent
        ) {
          return
        }

        context.report({
          node:
            node.parent.type === AST_NODE_TYPES.VariableDeclarator
              ? node.parent
              : node,
          messageId: 'unstable',
          fix: (() => {
            const { parent } = node

            if (
              parent.type !== AST_NODE_TYPES.VariableDeclarator ||
              parent.id.type !== AST_NODE_TYPES.Identifier
            ) {
              return
            }

            const nodeText = context.sourceCode.getText(node)
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
  }),
})
