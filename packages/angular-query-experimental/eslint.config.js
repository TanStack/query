// @ts-check

import vitest from '@vitest/eslint-plugin'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    plugins: { vitest },
    rules: {
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectSignals'] },
      ],
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
]
