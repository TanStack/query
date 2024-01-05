import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../../utils/create-rule'
import { ASTUtils } from '../../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

const ON_SUCCESS = 'onSuccess'
const ON_ERROR = 'onError'
const ON_SETTLED = 'onSettled'
const IS_DATA_EQUAL = 'isDataEqual'

const DEPRECATED_OPTIONS = [
  ON_SUCCESS,
  ON_ERROR,
  ON_SETTLED,
  IS_DATA_EQUAL,
] as const

const QUERY_CALLS = ['useQuery' as const]

const messages = {
  noDeprecatedOptions: `Option \`{{option}}\` will be removed in the next major version`,
}

type MessageKey = keyof typeof messages

export const name = 'no-deprecated-options'

export const rule: TSESLint.RuleModule<MessageKey, readonly unknown[]> =
  createRule({
    name,
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallows deprecated options',
        recommended: 'error',
      },
      messages: messages,
      schema: [],
    },
    defaultOptions: [],

    create(context, _, helpers) {
      return {
        CallExpression(node) {
          if (
            !ASTUtils.isIdentifierWithOneOfNames(node.callee, QUERY_CALLS) ||
            !helpers.isTanstackQueryImport(node.callee)
          ) {
            return
          }

          const firstArgument = node.arguments[0]

          if (!firstArgument) {
            return
          }

          if (
            node.arguments.length === 1 &&
            firstArgument.type === AST_NODE_TYPES.CallExpression
          ) {
            const referencedCallExpression =
              ASTUtils.getReferencedExpressionByIdentifier({
                context,
                node: firstArgument.callee,
              })

            if (
              referencedCallExpression === null ||
              !ASTUtils.isNodeOfOneOf(referencedCallExpression, [
                AST_NODE_TYPES.ArrowFunctionExpression,
                AST_NODE_TYPES.FunctionDeclaration,
                AST_NODE_TYPES.FunctionExpression,
              ])
            ) {
              return
            }

            if (
              referencedCallExpression.type ===
                AST_NODE_TYPES.ArrowFunctionExpression &&
              referencedCallExpression.expression
            ) {
              return runCheckOnNode({
                context: context,
                callNode: node,
                expression: referencedCallExpression.body,
                messageId: 'noDeprecatedOptions',
              })
            }

            const returnStmts = ASTUtils.getNestedReturnStatements(
              referencedCallExpression,
            )

            for (const stmt of returnStmts) {
              if (stmt.argument === null) {
                return
              }

              runCheckOnNode({
                context: context,
                callNode: node,
                expression: stmt.argument,
                messageId: 'noDeprecatedOptions',
              })
            }

            return
          }

          if (firstArgument.type === AST_NODE_TYPES.Identifier) {
            const referencedNode = ASTUtils.getReferencedExpressionByIdentifier(
              {
                context,
                node: firstArgument,
              },
            )

            if (referencedNode?.type === AST_NODE_TYPES.ObjectExpression) {
              return runCheckOnNode({
                context: context,
                callNode: node,
                expression: referencedNode,
                messageId: 'noDeprecatedOptions',
              })
            }
          }

          runCheckOnNode({
            context: context,
            callNode: node,
            expression: firstArgument,
            messageId: 'noDeprecatedOptions',
          })
        },
      }
    },
  })

function runCheckOnNode(params: {
  context: Readonly<TSESLint.RuleContext<MessageKey, readonly unknown[]>>
  callNode: TSESTree.CallExpression
  expression: TSESTree.Node
  messageId: MessageKey
}) {
  const { context, expression, messageId, callNode } = params

  const nodes = new Set([expression, ...callNode.arguments])

  for (const node of nodes) {
    for (const option of DEPRECATED_OPTIONS) {
      if (node.type !== AST_NODE_TYPES.ObjectExpression) {
        continue
      }

      const property = ASTUtils.findPropertyWithIdentifierKey(
        node.properties,
        option,
      )
      if (property) {
        context.report({ node: property, messageId, data: { option } })
      }
    }
  }
}
