// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt().prepend(
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: true,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  eslintConfigPrettier,
)
