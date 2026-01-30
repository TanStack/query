// @ts-check

import rootConfig from './root.eslint.config.js'
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'

export default [
  ...rootConfig,
  ...preact,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: {
      // Disable base rule to prevent overload false positives
      'no-redeclare': 'off',
      'no-duplicate-imports': 'off',
    },
  },
  {
    files: ['**/__tests__/**'],
  },
]
