import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../utils/ast-utils'
import { createRule } from '../utils/create-rule'
import { uniqueBy } from '../utils/unique-by'
import { ExhaustiveDepsUtils } from './exhaustive-deps.utils'
import type { TSESLint } from '@typescript-eslint/utils'

const QUERY_KEY = 'queryKey'
const QUERY_FN = 'queryFn'

export const name = 'exhaustive-deps'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Exhaustive deps rule for useQuery',
      recommended: 'error',
    },
    messages: {
      missingDeps: `The following dependencies are missing in your queryKey: {{deps}}`,
      fixTo: 'Fix to {{result}}',
    },
    hasSuggestions: true,
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    return {
      Property(node) {
        if (
          node.parent === undefined ||
          !ASTUtils.isObjectExpression(node.parent) ||
          !ASTUtils.isIdentifierWithName(node.key, QUERY_KEY)
        ) {
          return
        }

        const scopeManager = context.getSourceCode().scopeManager
        const queryKey = ASTUtils.findPropertyWithIdentifierKey(
          node.parent.properties,
          QUERY_KEY,
        )
        const queryFn = ASTUtils.findPropertyWithIdentifierKey(
          node.parent.properties,
          QUERY_FN,
        )

        if (
          scopeManager === null ||
          queryKey === undefined ||
          queryFn === undefined ||
          queryFn.value.type !== AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          return
        }

        let queryKeyNode = queryKey.value

        if (
          queryKeyNode.type === AST_NODE_TYPES.TSAsExpression &&
          queryKeyNode.expression.type === AST_NODE_TYPES.ArrayExpression
        ) {
          queryKeyNode = queryKeyNode.expression
        }

        if (queryKeyNode.type === AST_NODE_TYPES.Identifier) {
          const expression = ASTUtils.getReferencedExpressionByIdentifier({
            context,
            node: queryKeyNode,
          })

          if (expression?.type === AST_NODE_TYPES.ArrayExpression) {
            queryKeyNode = expression
          }
        }

        const sourceCode = context.getSourceCode()
        const queryKeyValue = queryKeyNode
        const externalRefs = ASTUtils.getExternalRefs({
          scopeManager,
          sourceCode,
          node: queryFn.value,
        })

        const relevantRefs = externalRefs.filter((reference) =>
          ExhaustiveDepsUtils.isRelevantReference({
            context,
            reference,
            scopeManager,
          }),
        )

        const existingKeys = ASTUtils.getNestedIdentifiers(queryKeyValue).map(
          (identifier) => ASTUtils.mapKeyNodeToText(identifier, sourceCode),
        )

        const missingRefs = relevantRefs
          .map((ref) => ({
            ref: ref,
            text: ASTUtils.mapKeyNodeToText(ref.identifier, sourceCode),
          }))
          .filter(({ ref, text }) => {
            return (
              !ref.isTypeReference &&
              !ASTUtils.isAncestorIsCallee(ref.identifier) &&
              !existingKeys.some((existingKey) => existingKey === text) &&
              !existingKeys.includes(text.split('.')[0] ?? '')
            )
          })
          .map(({ ref, text }) => ({
            identifier: ref.identifier,
            text: text,
          }))

        const uniqueMissingRefs = uniqueBy(missingRefs, (x) => x.text)

        if (uniqueMissingRefs.length > 0) {
          const missingAsText = uniqueMissingRefs
            .map((ref) => ASTUtils.mapKeyNodeToText(ref.identifier, sourceCode))
            .join(', ')

          const existingWithMissing = sourceCode
            .getText(queryKeyValue)
            .replace(/\]$/, `, ${missingAsText}]`)

          const suggestions: TSESLint.ReportSuggestionArray<string> = []

          if (queryKeyNode.type === AST_NODE_TYPES.ArrayExpression) {
            suggestions.push({
              messageId: 'fixTo',
              data: { result: existingWithMissing },
              fix(fixer) {
                return fixer.replaceText(queryKeyValue, existingWithMissing)
              },
            })
          }

          context.report({
            node: node,
            messageId: 'missingDeps',
            data: {
              deps: uniqueMissingRefs.map((ref) => ref.text).join(', '),
            },
            suggest: suggestions,
          })
        }
      },
    }
  },
})
