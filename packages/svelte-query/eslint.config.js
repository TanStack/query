// @ts-check

import pluginSvelte from 'eslint-plugin-svelte'

// @ts-ignore out of scope
import rootConfig from '../../eslint.config.js'

import svelteConfig from './svelte.config.js'

export default [
  ...rootConfig,
  ...pluginSvelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        svelteConfig,
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
]
