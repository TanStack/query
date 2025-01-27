// @ts-check

import vitest from '@vitest/eslint-plugin'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  {
    plugins: { vitest },
    rules: {
      'vitest/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['expect', 'expectArrayEqualIgnoreOrder'],
        },
      ],
    },
  },
]
