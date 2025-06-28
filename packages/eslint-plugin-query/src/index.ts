import { rules } from './rules'
import type { ESLint, Linter } from 'eslint'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

type RuleKey = keyof typeof rules

export interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, RuleModule<any, any, any>>
  configs: {
    recommended: ESLint.ConfigData
    'flat/recommended': Array<Linter.Config>
  }
}

export const plugin: Plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query',
  },
  configs: {} as Plugin['configs'],
  rules,
}

// Assign configs here so we can reference `plugin`
Object.assign(plugin.configs, {
  recommended: {
    plugins: ['@tanstack/query'],
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
      '@tanstack/query/infinite-query-property-order': 'error',
      '@tanstack/query/no-void-query-fn': 'error',
      '@tanstack/query/mutation-property-order': 'error',
    },
  },
  'flat/recommended': [
    {
      name: 'tanstack/query/flat/recommended',
      plugins: {
        '@tanstack/query': plugin,
      },
      rules: {
        '@tanstack/query/exhaustive-deps': 'error',
        '@tanstack/query/no-rest-destructuring': 'warn',
        '@tanstack/query/stable-query-client': 'error',
        '@tanstack/query/no-unstable-deps': 'error',
        '@tanstack/query/infinite-query-property-order': 'error',
        '@tanstack/query/no-void-query-fn': 'error',
        '@tanstack/query/mutation-property-order': 'error',
      },
    },
  ],
})

export default plugin
