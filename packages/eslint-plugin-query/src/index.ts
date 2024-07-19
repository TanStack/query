import { rules } from './rules'
import type { ESLint, Linter } from 'eslint'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

type RuleKey = keyof typeof rules

interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, RuleModule<any, any, any>>
  configs: Record<
    "recommended" | "flat/recommended",
    ESLint.ConfigData | Linter.FlatConfig | Array<Linter.FlatConfig>
  >
}

const plugin: Plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query',
  },
  configs: {} as Plugin['configs'],
  rules,
}

// Assign configs here so we can reference `plugin`
Object.assign(plugin.configs, {
  recommended: {
    plugins: ['@tanstack/eslint-plugin-query'],
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
    },
  },
  'flat/recommended': [
    {
      plugins: {
        '@tanstack/query': plugin,
      },
      rules: {
        '@tanstack/query/exhaustive-deps': 'error',
        '@tanstack/query/no-rest-destructuring': 'warn',
        '@tanstack/query/stable-query-client': 'error',
      },
    },
  ],
})

export default plugin
