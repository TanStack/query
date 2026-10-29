// @ts-check

import pluginQuery from '@tanstack/eslint-plugin-query'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended-strict'],
  {
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'route-prefetch/**/*.ts',
      'route-prefetch/**/*.tsx',
    ],
    rules: {
      // Not part of the recommended configs, so it has to be enabled explicitly
      '@tanstack/query/require-route-prefetch': 'error',
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
