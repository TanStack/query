// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...preact,
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  {
    rules: {
      'no-duplicate-imports': 'off',
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
    },
  },
])
