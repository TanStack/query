import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { createRule } from '../../utils/create-rule'
import { uniqueBy } from '../../utils/unique-by'

const QUERY_KEY = 'queryKey'
const QUERY_FN = 'queryFn'

export const name = 'exhaustive-deps'

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prefer object syntax for useQuery',
      recommended: 'error',
    },
    messages: {
      missingDeps: `The following dependencies are missing in your queryKey: {{deps}}`,
    },
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

        if (queryKey.value.type !== AST_NODE_TYPES.ArrayExpression) {
          // TODO support query key factory
          return
        }

        const sourceCode = context.getSourceCode()
        const queryKeyValue = queryKey.value
        const refs = ASTUtils.getExternalRefs({
          scopeManager,
          node: queryFn.value,
        })

        const existingKeys = ASTUtils.getNestedIdentifiers(queryKeyValue).map(
          (identifier) => ASTUtils.mapKeyNodeToText(identifier, sourceCode),
        )

        const missingRefs = refs
          .map((ref) => ({
            ref: ref,
            text: ASTUtils.mapKeyNodeToText(ref.identifier, sourceCode),
          }))
          .filter(({ ref, text }) => {
            return (
              !ASTUtils.isAncestorIsCallee(ref.identifier) &&
              !existingKeys.some((existingKey) => existingKey === text)
            )
          })
          .map(({ ref, text }) => ({
            identifier: ref.identifier,
            text: text,
          }))

        const uniqueMissingRefs = uniqueBy(missingRefs, (x) => x.text)

        if (uniqueMissingRefs.length > 0) {
          context.report({
            node: node,
            messageId: 'missingDeps',
            data: {
              deps: uniqueMissingRefs.map((ref) => ref.text).join(', '),
            },
            fix(fixer) {
              const missingAsText = uniqueMissingRefs
                .map((ref) =>
                  ASTUtils.mapKeyNodeToText(ref.identifier, sourceCode),
                )
                .join(', ')

              const existingWithMissing = sourceCode
                .getText(queryKeyValue)
                .replace(/\]$/, `, ${missingAsText}]`)

              return fixer.replaceText(queryKeyValue, existingWithMissing)
            },
          })
        }
      },
    }
  },
})
