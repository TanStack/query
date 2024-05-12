import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { uniqueBy } from '../../utils/unique-by'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { ExhaustiveDepsUtils } from './exhaustive-deps.utils'
import type { TSESLint } from '@typescript-eslint/utils'

const QUERY_KEY = 'queryKey'
const QUERY_FN = 'queryFn'

export const name = 'exhaustive-deps'

const createRule = ESLintUtils.RuleCreator(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Exhaustive deps rule for useQuery',
      recommended: 'error' as any,
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

  create: detectTanstackQueryImports((context) => {
    return {
      Property: (node) => {
        if (
          !ASTUtils.isObjectExpression(node.parent) ||
          !ASTUtils.isIdentifierWithName(node.key, QUERY_KEY)
        ) {
          return
        }

        const scopeManager = context.sourceCode.scopeManager
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
          !ASTUtils.isNodeOfOneOf(queryFn.value, [
            AST_NODE_TYPES.ArrowFunctionExpression,
            AST_NODE_TYPES.FunctionExpression,
          ])
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

        const queryKeyValue = queryKeyNode
        const externalRefs = ASTUtils.getExternalRefs({
          scopeManager,
          sourceCode: context.sourceCode,
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
          (identifier) =>
            ASTUtils.mapKeyNodeToText(identifier, context.sourceCode),
        )

        const missingRefs = relevantRefs
          .map((ref) => ({
            ref: ref,
            text: ASTUtils.mapKeyNodeToText(ref.identifier, context.sourceCode),
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
            .map((ref) =>
              ASTUtils.mapKeyNodeToText(ref.identifier, context.sourceCode),
            )
            .join(', ')

          const existingWithMissing = context.sourceCode
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
  }),
})
