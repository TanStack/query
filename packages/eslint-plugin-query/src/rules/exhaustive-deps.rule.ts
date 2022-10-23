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

const defaultRuleOptions = { whitelist: ['api', 'fetch', 'axios'] }

type RuleMessage = keyof typeof messages
type RuleOptions = { whitelist?: string[] }
type RuleContext = Readonly<TSESLint.RuleContext<RuleMessage, [RuleOptions]>>

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/tanstack/query',
)

export const exhaustiveDepsRule = createRule<[RuleOptions], RuleMessage>({
  name: 'exhausitive-deps',
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
      CallExpression(node) {
        if (
          ExtraUtils.isIdentifier(node.callee) &&
          node.callee.name === 'useQuery'
        ) {
          runCheck({ node, context })
        }
      },
    }
  },
})

function runCheck(params: {
  node: TSESTree.CallExpression
  context: RuleContext
}) {
  const { node, context } = params
  const queryOptions = node.arguments[0]
  const ruleOptions = { ...defaultRuleOptions, ...context.options[0] }

  if (queryOptions?.type !== AST_NODE_TYPES.ObjectExpression) {
    return
  }

  const scopeManager = context.getSourceCode().scopeManager
  const queryKey = ExtraUtils.findPropertyWithIdentifierKey(
    queryOptions.properties,
    'queryKey',
  )
  const queryFn = ExtraUtils.findPropertyWithIdentifierKey(
    queryOptions.properties,
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

  const queryKeyValue = queryKey.value
  const queryKeyDeps =
    ExtraUtils.getIdentifiersFromArrayExpression(queryKeyValue)
  const refs = getExternalRefs({ scopeManager, node: queryFn.value })
  const missingRefs = refs
    .map((ref) => ref.identifier)
    .filter((ref) => !ruleOptions.whitelist.includes(ref.name))
    .filter((ref) => !queryKeyDeps.some((y) => y.name === ref.name))

  if (missingRefs.length > 0) {
    context.report({
      node: node.callee,
      messageId: 'missingDeps',
      data: {
        deps: missingRefs.map(nodeToText).join(', '),
      },
      fix(fixer) {
        const relevantQueryKeyDeps = queryKeyValue.elements.filter(
          (element) =>
            ExtraUtils.isIdentifier(element) || ExtraUtils.isLiteral(element),
        )
        const newQueryKeyDeps = [...relevantQueryKeyDeps, ...missingRefs]

        return fixer.replaceText(
          queryKeyValue,
          `[${newQueryKeyDeps.map((x) => nodeToText(x)).join(', ')}]`,
        )
      },
    })
  }
}

function nodeToText(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name
  }

  if (node.type === AST_NODE_TYPES.Literal) {
    return node.raw
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    const expressions = node.expressions.map((x) => nodeToText(x))
    const quasis = node.quasis.map((x) => x.value.raw)
    return quasis.reduce((acc, x, i) => acc + x + (expressions[i] ?? ''), '')
  }

  return null
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
  const localRefIds = new Set([...scope.set.values()].map((x) => x.$id))
  const externalRefs = readOnlyRefs.filter(
    (x) => x.resolved === null || !localRefIds.has(x.resolved.$id),
  )

  return uniqueBy(externalRefs, (x) => x.resolved)
}

function uniqueBy<T>(arr: T[], fn: (x: T) => unknown): T[] {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
