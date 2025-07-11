// @ts-check

import vitest from '@vitest/eslint-plugin'

// @ts-ignore out of scope
import rootConfig from '../../eslint.config.js'

export default [
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
