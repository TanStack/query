import type { TSESLint } from '@typescript-eslint/utils'
import { rules } from '../rules'

function generateRecommendedConfig(
  allRules: Record<string, TSESLint.RuleModule<any, any>>,
) {
  return Object.entries(allRules).reduce((memo, [name, rule]) => {
    const { recommended } = rule.meta.docs || {}

    return {
      ...memo,
      ...(recommended ? { [`@tanstack/query/${name}`]: recommended } : {}),
    }
  }, {} as Record<string, 'strict' | 'error' | 'warn'>)
}

export const configs = {
  recommended: {
    plugins: ['@tanstack/eslint-plugin-query'],
    rules: generateRecommendedConfig(rules),
  },
}
