// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginSvelte from 'eslint-plugin-svelte'
import tsParser from '@typescript-eslint/parser'
import { defineConfig } from 'eslint/config'
import svelteConfig from './svelte.config.js'

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
        svelteConfig,
      },
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
