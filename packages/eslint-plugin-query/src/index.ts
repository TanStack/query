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

export const plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query',
  },
  configs: {
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
          '@tanstack/query': {}, // Assigned after plugin object created
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
  },
  rules,
} satisfies Plugin

plugin.configs['flat/recommended'][0]!.plugins['@tanstack/query'] = plugin

export default plugin
