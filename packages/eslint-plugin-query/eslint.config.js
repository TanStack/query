// @ts-check

import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'expectArrayEqualIgnoreOrder'],
        },
      ],
    },
  },
]
