import { rules } from './rules'
import type { ESLint, Linter } from 'eslint'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

type RuleKey = keyof typeof rules

/**
 * The ESLint plugin object: its `rules`, and its configs — the legacy `recommended` and the flat
 * `flat/recommended`.
 */
export interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  /**
   * The rules of the plugin, keyed by rule name.
   */
  rules: Record<RuleKey, RuleModule<any, any, any>>
  /**
   * The shareable configs: the legacy `recommended` and the flat `flat/recommended`.
   */
  configs: {
    recommended: ESLint.ConfigData
    'flat/recommended': Array<Linter.Config>
  }
}

const recommendedRules = {
  '@tanstack/query-prefetch/require-prefetch': 'error',
} as const

export const plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query-prefetch',
  },
  configs: {
    recommended: {
      plugins: ['@tanstack/query-prefetch'],
      rules: recommendedRules,
    },
    'flat/recommended': [
      {
        name: 'tanstack/query-prefetch/flat/recommended',
        plugins: {
          '@tanstack/query-prefetch': {}, // Assigned after plugin object created
        },
        rules: recommendedRules,
      },
    ],
  },
  rules,
} satisfies Plugin

plugin.configs['flat/recommended'][0]!.plugins['@tanstack/query-prefetch'] =
  plugin

export default plugin
