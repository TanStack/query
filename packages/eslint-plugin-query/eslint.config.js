// @ts-check

import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
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
])
