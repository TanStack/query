// @ts-check

import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
  ...rootConfig,
  {
    files: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
])
