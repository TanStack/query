// @ts-check

import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: { 'vitest/expect-expect': 'warn' },
  },
]
