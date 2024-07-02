import { recommended } from './configs/recommended'
import { flatRecommended } from './configs/flatRecommended'
import { rules } from './rules'
import type { ESLint } from 'eslint'
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint'

type RuleKey = keyof typeof rules

interface Plugin extends Omit<ESLint.Plugin, 'rules'> {
  rules: Record<RuleKey, RuleModule<any, any, any>>
}

const plugin: Plugin = {
  meta: {
    name: '@tanstack/eslint-plugin-query',
  },
  configs: {
    recommended: recommended,
    'flat/recommended': flatRecommended,
  },
  rules,
}

export default plugin
