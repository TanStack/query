import { rules } from './rules'
import type { ESLintUtils } from '@typescript-eslint/utils'
import type { RuleDocs } from './types'

function generateRecommendedConfig(
  allRules: Record<
    string,
    ESLintUtils.RuleModule<
      string,
      ReadonlyArray<unknown>,
      RuleDocs,
      ESLintUtils.RuleListener
    >
  >,
) {
  return Object.entries(allRules).reduce(
    (memo, [name, rule]) => {
      const { recommended } = rule.meta.docs || {}

      return {
        ...memo,
        ...(recommended ? { [`@tanstack/query/${name}`]: recommended } : {}),
      }
    },
    {} as Record<string, RuleDocs['recommended']>,
  )
}

export const configs = {
  recommended: {
    plugins: ['@tanstack/eslint-plugin-query'],
    rules: generateRecommendedConfig(rules),
  },
}
