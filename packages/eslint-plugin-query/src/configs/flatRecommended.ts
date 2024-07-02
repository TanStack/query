import type { Linter } from 'eslint'

export const flatRecommended = [
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',
    },
  },
] satisfies Array<Linter.FlatConfig>
