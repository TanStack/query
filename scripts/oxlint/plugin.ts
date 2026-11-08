import { builtinRules } from 'eslint/use-at-your-own-risk'
import type { ESLint } from 'eslint'

const noRestrictedSyntax = builtinRules.get('no-restricted-syntax')

if (!noRestrictedSyntax) {
  throw new Error('ESLint core rule `no-restricted-syntax` was not found')
}

const plugin: ESLint.Plugin = {
  meta: { name: 'tanstack-query' },
  rules: {
    'no-restricted-syntax': noRestrictedSyntax,
  },
}

export default plugin
