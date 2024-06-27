// @ts-check

import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
]
