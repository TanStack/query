// @ts-check

import rootConfig from '../../eslint.config.js'
import vitest from '@vitest/eslint-plugin'

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
      'cspell/spell-checker': [
        'warn',
        {
          ignoreWords: ['combinate'],
        },
      ],
    },
  },
]
