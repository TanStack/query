import type { Linter } from 'eslint'

export const flatRecommended: Array<Linter.FlatConfig> = [
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
    },
  },
]
