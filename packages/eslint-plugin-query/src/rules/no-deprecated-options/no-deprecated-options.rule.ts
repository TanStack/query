import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../../utils/create-rule'
import { ASTUtils } from '../../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

const ON_SUCCESS = 'onSuccess'
const ON_ERROR = 'onError'
const ON_SETTLED = 'onSettled'

const CALLBACKS = [ON_SUCCESS, ON_ERROR, ON_SETTLED]

const QUERY_CALLS = ['useQuery']

const messages = {
  noCallbacks: `The following callbacks will be removed in the next major version: {{callbacks}}`,
}

type MessageKey = keyof typeof messages

export const name = 'no-deprecated-options'

export const rule: TSESLint.RuleModule<MessageKey, readonly unknown[]> =
  createRule({
    name,
    meta: {
      type: 'problem',
      docs: {
        description: 'Makes sure that deprecated callbacks are not used',
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
                messageId: 'noCallbacks',
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
                messageId: 'noCallbacks',
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
                messageId: 'noCallbacks',
              })
            }
          }

          runCheckOnNode({
            context: context,
            callNode: node,
            expression: firstArgument,
            messageId: 'noCallbacks',
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

  const callbacks = CALLBACKS.filter((callback) =>
    [expression, ...callNode.arguments].some(
      (node) =>
        node.type === AST_NODE_TYPES.ObjectExpression &&
        ASTUtils.findPropertyWithIdentifierKey(node.properties, callback),
    ),
  )

  if (callbacks.length > 0) {
    context.report({
      node: callNode,
      messageId,
      data: {
        callbacks: callbacks.join(', '),
      },
    })
  }
}
