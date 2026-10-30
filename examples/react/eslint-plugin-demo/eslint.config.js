// @ts-check

import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginQueryPrefetch from '@tanstack/eslint-plugin-query-prefetch'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended-strict'],
  {
    ...pluginQueryPrefetch.configs['flat/recommended'][0],
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'require-prefetch/**/*.ts',
      'require-prefetch/**/*.tsx',
    ],
  },
  {
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'require-prefetch/**/*.ts',
      'require-prefetch/**/*.tsx',
    ],
    rules: {
      '@tanstack/query/exhaustive-deps': [
        'error',
        {
          allowlist: {
            variables: ['api'],
            types: ['AnalyticsClient'],
          },
        },
      ],
    },
  },
])
