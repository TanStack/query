import type { JSONSchema, TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import * as recast from 'recast'
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

  const queryKeyValue = queryKey.value
  const queryKeyDeps = ExtraUtils.getIdentifiersRecursive(queryKeyValue)
  const refs = getExternalRefs({ scopeManager, node: queryFn.value })
  const missingRefs = refs
    .filter((reference) => {
      return (
        !ExtraUtils.isAncestorIsCallee(reference.identifier) &&
        !ruleOptions.whitelist.includes(reference.identifier.name) &&
        !queryKeyDeps.some((y) => y.name === reference.identifier.name)
      )
    })
    .map((ref) => ref.identifier)

  if (missingRefs.length > 0) {
    context.report({
      node: node,
      messageId: 'missingDeps',
      data: {
        deps: missingRefs.map((ref) => ref.name).join(', '),
      },
      fix(fixer) {
        const newQueryKeyText = [
          ...queryKeyValue.elements,
          ...missingRefs.map((ref) => ExtraUtils.builder.identifier(ref.name)),
        ]
          .map((x) =>
            inlineCode(
              recast.print(x, { quote: ExtraUtils.getNodeLiteralQuote(x) })
                .code,
            ),
          )
          .join(', ')

        return fixer.replaceText(queryKeyValue, `[${newQueryKeyText}]`)
      },
    })
  }
}

function inlineCode(code: string) {
  return code
    .replace(/[\n\s]/gm, '')
    .replace(/([,:])/gm, '$1 ')
    .replace(/^(?:){(.*)}/gm, '{ $1 }')
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

function uniqueBy<T>(arr: T[], fn: (x: T) => unknown): T[] {
  return arr.filter((x, i, a) => a.findIndex((y) => fn(x) === fn(y)) === i)
}
