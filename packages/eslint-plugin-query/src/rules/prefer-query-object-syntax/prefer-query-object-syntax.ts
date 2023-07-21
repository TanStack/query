import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../../utils/create-rule'
import { ASTUtils } from '../../utils/ast-utils'
import { objectKeys } from '../../utils/object-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

const QUERY_CALLS = {
  useQuery: { key: 'queryKey', fn: 'queryFn', type: 'query' },
  createQuery: { key: 'queryKey', fn: 'queryFn', type: 'query' },
  useMutation: { key: 'mutationKey', fn: 'mutationFn', type: 'mutation' },
  createMutation: { key: 'mutationKey', fn: 'mutationFn', type: 'mutation' },
}

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
          if (
            !ASTUtils.isIdentifierWithOneOfNames(
              node.callee,
              objectKeys(QUERY_CALLS),
            ) ||
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
                callString: node.callee.name,
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
                callString: node.callee.name,
                expression: referencedNode,
                messageId: 'preferObjectSyntax',
              })
            }
          }

          runCheckOnNode({
            context: context,
            callNode: node,
            callString: node.callee.name,
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
  callString: keyof typeof QUERY_CALLS
  expression: TSESTree.Node
  messageId: MessageKey
}) {
  const { context, expression, messageId, callNode, callString } = params
  const sourceCode = context.getSourceCode()

  if (expression.type === AST_NODE_TYPES.ObjectExpression) {
    return
  }

  const secondArgument = callNode.arguments[1]
  const thirdArgument = callNode.arguments[2]

  const optionsObject =
    secondArgument?.type === AST_NODE_TYPES.ObjectExpression
      ? secondArgument
      : thirdArgument !== undefined &&
        ASTUtils.isNodeOfOneOf(thirdArgument, [
          AST_NODE_TYPES.ObjectExpression,
          AST_NODE_TYPES.Identifier,
        ])
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

  const callProps = QUERY_CALLS[callString]

  context.report({
    node: callNode,
    messageId: 'preferObjectSyntax',
    fix(fixer) {
      const optionsObjectProperties: string[] = []

      if (callProps.type === 'query') {
        // queryKey
        const firstArgument = callNode.arguments[0]
        const queryKey = sourceCode.getText(firstArgument)
        const queryKeyProperty =
          queryKey === callProps.key
            ? callProps.key
            : `${callProps.key}: ${queryKey}`

        optionsObjectProperties.push(queryKeyProperty)

        // queryFn
        if (secondArgument && secondArgument !== optionsObject) {
          const queryFn = sourceCode.getText(secondArgument)
          const queryFnProperty =
            queryFn === callProps.fn
              ? callProps.fn
              : `${callProps.fn}: ${queryFn}`

          optionsObjectProperties.push(queryFnProperty)
        }
      }

      if (callProps.type === 'mutation') {
        const isMutationKeyPresent =
          callNode.arguments.length === 3 ||
          callNode.arguments[1]?.type === 'ArrowFunctionExpression'

        if (isMutationKeyPresent) {
          const mutationKeyNode = callNode.arguments[0]
          const mutationKeyText = sourceCode.getText(mutationKeyNode)
          const mutationKeyProperty =
            mutationKeyText === callProps.key
              ? callProps.key
              : `${callProps.key}: ${mutationKeyText}`

          optionsObjectProperties.push(mutationKeyProperty)
        }

        const mutationFnNode = callNode.arguments[isMutationKeyPresent ? 1 : 0]
        const mutationFnText = sourceCode.getText(mutationFnNode)
        const mutationFnProperty =
          mutationFnText === callProps.fn
            ? callProps.fn
            : `${callProps.fn}: ${mutationFnText}`

        optionsObjectProperties.push(mutationFnProperty)
      }

      // options
      if (optionsObject?.type === AST_NODE_TYPES.ObjectExpression) {
        const existingObjectProperties = optionsObject.properties.map(
          (objectLiteral) => {
            return sourceCode.getText(objectLiteral)
          },
        )

        optionsObjectProperties.push(...existingObjectProperties)
      }

      if (optionsObject?.type === AST_NODE_TYPES.Identifier) {
        optionsObjectProperties.push(`...${sourceCode.getText(optionsObject)}`)
      }

      const calleeText = sourceCode.getText(callNode).split('(')[0]
      const argsText = `{ ${optionsObjectProperties.join(', ')} }`

      return fixer.replaceText(callNode, `${calleeText}(${argsText})`)
    },
  })
}
