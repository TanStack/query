// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.vue'],
      },
    },
  },
])
