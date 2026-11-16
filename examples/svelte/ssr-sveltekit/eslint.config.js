// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import tsParser from '@typescript-eslint/parser'
import pluginSvelte from 'eslint-plugin-svelte'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  ...pluginSvelte.configs.recommended,
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    settings: {
      'import-x/internal-regex': '^(~/|@/|#|\\$app/|\\$lib/)',
    },
  },
  {
    rules: {
      '@tanstack/query/exhaustive-deps': [
        'error',
        { allowlist: { variables: ['customFetch'] } },
      ],
    },
  },
])
