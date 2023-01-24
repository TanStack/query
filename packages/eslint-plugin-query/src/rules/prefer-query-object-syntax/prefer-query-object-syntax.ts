import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../../utils/create-rule'
import { ASTUtils } from '../../utils/ast-utils'

const QUERY_CALLS = ['useQuery', 'createQuery']

const messages = {
  preferObjectSyntax: `Objects syntax for query is preferred`,
  returnTypeAreNotObjectSyntax: `Return type of query should be object syntax. Got {{returnType}} instead`,
}

type MessageKey = keyof typeof messages

export const name = 'prefer-query-object-syntax'

export const rule: TSESLint.RuleModule<MessageKey, readonly unknown[]> =
  createRule({
    name,
    meta: {
      type: 'problem',
      docs: {
        description: 'Prefer object syntax for useQuery',
        recommended: 'error',
      },
      messages: messages,
      fixable: 'code',
      schema: [],
    },
    defaultOptions: [],

    create(context, _, helpers) {
      return {
        CallExpression(node) {
          const isTanstackQueryCall =
            ASTUtils.isIdentifierWithOneOfNames(node.callee, QUERY_CALLS) &&
            helpers.isTanstackQueryImport(node.callee)

          if (!isTanstackQueryCall) {
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
                AST_NODE_TYPES.FunctionExpression,
              ])
            ) {
              return
            }

            if (
              !ASTUtils.isNodeOfOneOf(referencedCallExpression.body, [
                AST_NODE_TYPES.BlockStatement,
                AST_NODE_TYPES.ObjectExpression,
              ])
            ) {
              return context.report({
                node,
                messageId: 'returnTypeAreNotObjectSyntax',
                data: {
                  returnType: context
                    .getSourceCode()
                    .getText(referencedCallExpression.body),
                },
              })
            }

            const returnStmts = ASTUtils.getNestedReturnStatements(
              referencedCallExpression,
            )

            for (const stmt of returnStmts) {
              if (stmt.argument === null) {
                return context.report({
                  node,
                  messageId: 'returnTypeAreNotObjectSyntax',
                  data: {
                    returnType: 'void',
                  },
                })
              }

              runCheckOnNode({
                context: context,
                callNode: node,
                expression: stmt.argument,
                messageId: 'returnTypeAreNotObjectSyntax',
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
                messageId: 'preferObjectSyntax',
              })
            }
          }

          runCheckOnNode({
            context: context,
            callNode: node,
            expression: firstArgument,
            messageId: 'preferObjectSyntax',
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
  const sourceCode = context.getSourceCode()

  if (expression.type === AST_NODE_TYPES.ObjectExpression) {
    return
  }

  const secondArgument = callNode.arguments[1]
  const thirdArgument = callNode.arguments[2]

  const optionsObject =
    secondArgument?.type === AST_NODE_TYPES.ObjectExpression
      ? secondArgument
      : thirdArgument?.type === AST_NODE_TYPES.ObjectExpression
      ? thirdArgument
      : undefined

  if (
    secondArgument &&
    !thirdArgument &&
    secondArgument !== optionsObject &&
    secondArgument.type === AST_NODE_TYPES.Identifier
  ) {
    // Unable to determine if the secondArgument identifier is the options object or query fn.
    // User has to fix the code manually.
    context.report({ node: callNode, messageId: messageId })
    return
  }

  if (messageId === 'returnTypeAreNotObjectSyntax') {
    context.report({
      node: callNode,
      messageId: 'returnTypeAreNotObjectSyntax',
      data: {
        returnType: sourceCode.getText(expression),
      },
    })
    return
  }

  context.report({
    node: callNode,
    messageId: 'preferObjectSyntax',
    fix(fixer) {
      const optionsObjectProperties: string[] = []

      // queryKey
      const firstArgument = callNode.arguments[0]
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

      const calleeText = sourceCode.getText(callNode).split('(')[0]
      const argsText = `{ ${optionsObjectProperties.join(', ')} }`

      return fixer.replaceText(callNode, `${calleeText}(${argsText})`)
    },
  })
}
