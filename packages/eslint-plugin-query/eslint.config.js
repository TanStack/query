// @ts-check

import vitest from '@vitest/eslint-plugin'
import rootConfig from './root.eslint.config.js'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...rootConfig,
  {
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'expectArrayEqualIgnoreOrder'],
        },
      ],
    },
  },
]

export default config
