import pluginQuery from '@tanstack/eslint-plugin-query'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended-strict'],
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
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
]
