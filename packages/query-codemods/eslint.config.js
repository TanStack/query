// @ts-check

import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    rules: {
      '@cspell/spellchecker': 'off',
      'ts/no-unused-vars': 'off',
      'ts/no-unnecessary-condition': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'no-shadow': 'off',
      'sort-imports': 'off',
    },
  },
]
