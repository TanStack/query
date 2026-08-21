// @ts-check

import tsParser from '@typescript-eslint/parser'
import pluginSvelte from 'eslint-plugin-svelte'
import rootConfig from './root.eslint.config.js'
import svelteConfig from './svelte.config.js'

export default [
  ...rootConfig,
  ...pluginSvelte.configs['recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
    rules: {
      // Svelte runes and proxy state produce false positives for this rule.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    rules: {
      'svelte/block-lang': ['error', { script: ['ts'] }],
      'svelte/no-svelte-internal': 'error',
      'svelte/valid-compile': 'off',
    },
  },
]
