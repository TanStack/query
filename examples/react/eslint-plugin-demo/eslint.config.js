import pluginQuery from '@tanstack/eslint-plugin-query'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
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

export default config
