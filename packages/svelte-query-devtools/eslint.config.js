// @ts-check

import tseslint from 'typescript-eslint'
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
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
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
