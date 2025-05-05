// @ts-check

import { rules } from '@cspell/eslint-plugin'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      'vitest/expect-expect': 'warn',
    },
  },
]
