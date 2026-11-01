// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.vue'],
      },
    },
  },
  eslintConfigPrettier,
])
