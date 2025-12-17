// @ts-check

import rootConfig from './root.eslint.config.js'
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'
import tseslint from 'typescript-eslint'

export default [
  ...rootConfig,
  ...preact,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      'typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Disable base rule to prevent overload false positives
      'no-redeclare': 'off',
      'no-duplicate-imports': 'off',
      // TS-aware version handles overloads correctly
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-duplicate-imports': 'error',
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      '@eslint-react/dom/no-missing-button-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
