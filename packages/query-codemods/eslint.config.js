// @ts-check

import rootConfig from './root.eslint.config.js'

/** @type {import('eslint').Linter.Config[]} */
const config = [
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
]

export default config
