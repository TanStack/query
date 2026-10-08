// @ts-check

// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'
import tsParser from '@typescript-eslint/parser'
import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
  ...rootConfig,
  ...preact,
  {
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // Disable base rule to prevent overload false positives
      'no-redeclare': 'off',
      'no-duplicate-imports': 'off',
      'no-unused-vars': 'off',
      'no-import-assign': 'off',
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
])
