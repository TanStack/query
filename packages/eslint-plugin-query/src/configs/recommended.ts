import type { ESLint } from 'eslint'

export const recommended: ESLint.ConfigData = {
  plugins: ['@tanstack/eslint-plugin-query'],
  rules: {
    '@tanstack/query/exhaustive-deps': 'error',
    '@tanstack/query/no-rest-destructuring': 'warn',
    '@tanstack/query/stable-query-client': 'error',
  },
}
