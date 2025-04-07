import { rules } from './rules'
import type { ESLint, Linter } from 'eslint'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'
import type { TSESLint } from '@typescript-eslint/utils'

type RuleKey = keyof typeof rules

export interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, RuleModule<any, any, any>>
  configs: {
    recommended: ESLint.ConfigData
    recommendedTypeChecked: ESLint.ConfigData
    'flat/recommended': Array<Linter.Config>
    'flat/recommendedTypeChecked': Array<Linter.Config>
  }
}

const plugin: Plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query',
  },
  configs: {} as Plugin['configs'],
  rules,
}

const rulesRecord: TSESLint.SharedConfig.RulesRecord = {
  '@tanstack/query/exhaustive-deps': 'error',
  '@tanstack/query/no-rest-destructuring': 'warn',
  '@tanstack/query/stable-query-client': 'error',
  '@tanstack/query/no-unstable-deps': 'error',
  '@tanstack/query/infinite-query-property-order': 'error',
}

const rulesTypeCheckedRecord: TSESLint.SharedConfig.RulesRecord = {
  ...rulesRecord,
  '@tanstack/query/no-void-query-fn': 'error',
}

// Assign configs here so we can reference `plugin`
Object.assign(plugin.configs, {
  recommended: {
    plugins: ['@tanstack/query'],
    rules: rulesRecord,
  },
  recommendedTypeChecked: {
    plugins: ['@tanstack/query'],
    rules: rulesTypeCheckedRecord,
  },
  'flat/recommended': [
    {
      name: 'tanstack/query/flat/recommended',
      plugins: { '@tanstack/query': plugin },
      rules: rulesRecord,
    },
  ],
  'flat/recommendedTypeChecked': [
    {
      name: 'tanstack/query/flat/recommendedTypeChecked',
      plugins: { '@tanstack/query': plugin },
      rules: rulesTypeCheckedRecord,
    },
  ],
} satisfies Record<
  string,
  TSESLint.FlatConfig.ConfigArray | TSESLint.ClassicConfig.Config
>)

export default plugin
