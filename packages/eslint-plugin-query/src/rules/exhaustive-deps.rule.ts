import type { JSONSchema, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ExtraUtils } from '../extra-utils'

const messages = {
  missingDeps:
    'The following dependencies are missing in your queryKey: {{deps}}',
}

const ruleSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  minItems: 0,
  maxItems: 1,
  items: {
    type: 'object',
    properties: {
      whitelist: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
}

const defaultRuleOptions = { whitelist: [] }

type RuleMessage = keyof typeof messages
type RuleOptions = { whitelist?: string[] }
type RuleContext = Readonly<TSESLint.RuleContext<RuleMessage, [RuleOptions]>>

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/tanstack/query',
)

export const exhaustiveDepsRule = createRule<[RuleOptions], RuleMessage>({
  name: 'exhaustive-deps',
  meta: {
    docs: {
      description:
        'This rule ensures that all dependencies are passed to the useQuery queryKey parameter',
      recommended: 'warn',
    },
    messages: messages,
    type: 'problem',
    fixable: 'code',
    schema: ruleSchema,
  },
  defaultOptions: [defaultRuleOptions],
  create(context) {
    return {
      Property(node) {
        if (ExtraUtils.isIdentifierWithName(node.key, 'queryKey')) {
          runCheck({ node, context })
        }
      },
    }
  },
})

function runCheck(params: { node: TSESTree.Property; context: RuleContext }) {
  const { node, context } = params
  const ruleOptions = { ...defaultRuleOptions, ...context.options[0] }

  if (
    node.parent === undefined ||
    !ExtraUtils.isObjectExpression(node.parent)
  ) {
    return
  }

  const scopeManager = context.getSourceCode().scopeManager
  const queryKey = ExtraUtils.findPropertyWithIdentifierKey(
    node.parent.properties,
    'queryKey',
  )
  const queryFn = ExtraUtils.findPropertyWithIdentifierKey(
    node.parent.properties,
    'queryFn',
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
  const refs = getExternalRefs({ scopeManager, node: queryFn.value })

  const existingKeys = ExtraUtils.getNestedIdentifiers(queryKeyValue).map(
    (identifier) => mapKeyNodeToText(identifier, sourceCode),
  )

  const missingRefs = refs
    .map((ref) => ({
      ref: ref,
      text: mapKeyNodeToText(ref.identifier, sourceCode),
    }))
    .filter(({ ref, text }) => {
      return (
        !ExtraUtils.isAncestorIsCallee(ref.identifier) &&
        !ruleOptions.whitelist.includes(ref.identifier.name) &&
        !existingKeys.some((existingKey) => existingKey === text)
      )
    })
    .map(({ ref, text }) => ({ identifier: ref.identifier, text: text }))

  if (missingRefs.length > 0) {
    context.report({
      node: node,
      messageId: 'missingDeps',
      data: {
        deps: missingRefs.map((ref) => ref.text).join(', '),
      },
      fix(fixer) {
        const missingAsText = missingRefs
          .map((ref) => mapKeyNodeToText(ref.identifier, sourceCode))
          .join(', ')

        const existingWithMissing = sourceCode
          .getText(queryKeyValue)
          .replace(/\]$/, `, ${missingAsText}]`)

        return fixer.replaceText(queryKeyValue, existingWithMissing)
      },
    })
  }
}

function getExternalRefs(params: {
  scopeManager: TSESLint.Scope.ScopeManager
  node: TSESTree.Node
}): TSESLint.Scope.Reference[] {
  const { scopeManager, node } = params
  const scope = scopeManager.acquire(node)

  if (scope === null) {
    return []
  }

  const readOnlyRefs = scope.references.filter((x) => x.isRead())
  const localRefIds = new Set(
    [...scope.set.values()].map((x) => x.identifiers[0]),
  )
  const externalRefs = readOnlyRefs.filter(
    (x) => x.resolved === null || !localRefIds.has(x.resolved.identifiers[0]),
  )

  return uniqueBy(externalRefs, (x) => x.resolved)
}

function mapKeyNodeToText(
  node: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
) {
  return sourceCode.getText(
    ExtraUtils.traverseUpOnly(node, [
      AST_NODE_TYPES.MemberExpression,
      AST_NODE_TYPES.Identifier,
    ]),
  )
}

function uniqueBy<T>(arr: T[], fn: (x: T) => unknown): T[] {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
