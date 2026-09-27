// @ts-check

import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
]
