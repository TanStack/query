import { builtinRules } from 'eslint/use-at-your-own-risk'
import type { ESLint, Rule } from 'eslint'

const noRestrictedSyntax = builtinRules.get('no-restricted-syntax')

if (!noRestrictedSyntax) {
  throw new Error('ESLint core rule `no-restricted-syntax` was not found')
}

const typeParameterPattern = /^(T|T[A-Z][A-Za-z]+)$/

/**
 * Replaces `@typescript-eslint/naming-convention`, which requires type
 * information from the ESLint parser services that Oxlint does not provide.
 */
const typeParameterNaming: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: `Require type parameter names to match ${typeParameterPattern}`,
    },
    schema: [],
  },
  create: (context) => ({
    TSTypeParameter(node: {
      name: string | { name: string }
      parent: { type: string }
    }) {
      // Matches `@typescript-eslint/naming-convention`, which skips `infer` declarations
      if (node.parent.type === 'TSInferType') return
      const name = typeof node.name === 'string' ? node.name : node.name.name
      if (!typeParameterPattern.test(name)) {
        context.report({
          // @ts-expect-error TSESTree node types are not part of ESLint's node map
          node,
          message: `Type parameter \`${name}\` must match ${typeParameterPattern}.`,
        })
      }
    },
  }),
}

const plugin: ESLint.Plugin = {
  meta: { name: 'tanstack-query' },
  rules: {
    'no-restricted-syntax': noRestrictedSyntax,
    'type-parameter-naming': typeParameterNaming,
  },
}

export default plugin
