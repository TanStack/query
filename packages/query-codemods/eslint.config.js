// @ts-check

import vitest from '@vitest/eslint-plugin'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      'cspell/spellchecker': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'import/no-duplicates': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'no-shadow': 'off',
      'sort-imports': 'off',
    },
  },
  {
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'warn',
    },
  },
]
