// @ts-check

import tsParser from '@typescript-eslint/parser'
import pluginSvelte from 'eslint-plugin-svelte'
import { defineConfig } from 'eslint/config'

// Only the Svelte rules, which need the component template; everything else is linted by Oxlint
export default defineConfig([
  ...pluginSvelte.configs['recommended'],
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
    rules: {
      'svelte/block-lang': ['error', { script: ['ts'] }],
      'svelte/no-svelte-internal': 'error',
      'svelte/valid-compile': 'off',
    },
  },
])
