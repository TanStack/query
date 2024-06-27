// @ts-check

import tseslint from 'typescript-eslint'
// @ts-expect-error
import pluginVue from 'eslint-plugin-vue'
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  ...pluginVue.configs['flat/base'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser,
      },
    },
  },
]
