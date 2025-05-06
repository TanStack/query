// @ts-check

import vitest from '@vitest/eslint-plugin'
import pluginSvelte from 'eslint-plugin-svelte'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  ...pluginSvelte.configs['flat/recommended'],
  {
    rules: {
      'svelte/block-lang': ['error', { script: ['ts'] }],
      'svelte/no-svelte-internal': 'error',
      'svelte/valid-compile': 'off',
    },
  },
  {
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'warn',
    },
  },
]
