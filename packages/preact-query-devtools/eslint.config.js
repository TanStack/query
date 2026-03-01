// @ts-check
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'
// eslint-config-preact uses typescript-eslint under the hood
import tseslint from 'typescript-eslint'

import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  ...preact,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      'typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Disable base rule to prevent overload false positives
      'no-redeclare': 'off',
      'no-duplicate-imports': 'off',
      'no-unused-vars': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      'no-import-assign': 'off',
      // TS-aware version handles overloads correctly
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
