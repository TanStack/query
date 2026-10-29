// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  {
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: true,
        extraFileExtensions: ['.vue'],
      },
    },
  },
])
