// @ts-check

import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
  ...rootConfig,
  {
    rules: {
      'cspell/spellchecker': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'import/no-duplicates': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'no-shadow': 'off',
      'sort-imports': 'off',
    },
  },
  {
    files: ['src/**/__testfixtures__/**'],
    rules: {
      // Codemod fixtures intentionally preserve historical QueryClient syntax.
      'no-restricted-syntax': 'off',
    },
  },
])
