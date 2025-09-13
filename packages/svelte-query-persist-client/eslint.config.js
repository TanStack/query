// @ts-check

import pluginSvelte from 'eslint-plugin-svelte'
import rootConfig from './root.eslint.config.js'
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
      'svelte/no-unused-svelte-ignore': 'off',
      'svelte/valid-compile': 'off',
    },
  },
]
