// @ts-check

import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    files: ['**/__tests__/**'],
    rules: { '@typescript-eslint/require-await': 'error' },
  },
]
