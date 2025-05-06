// @ts-check

import vitest from '@vitest/eslint-plugin'
// @ts-expect-error
import pluginVue from 'eslint-plugin-vue'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  ...pluginVue.configs['flat/base'],
  {
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'warn',
    },
  },
]
