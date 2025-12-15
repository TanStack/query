// @ts-check

import reactHooks from 'eslint-plugin-react-hooks'
import rootConfig from './root.eslint.config.js'
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'
import tseslint from 'typescript-eslint'

export default [
  ...rootConfig,
  // @ts-expect-error wtf
  ...reactHooks.configs['recommended-latest'],
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
      '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/incompatible-library': 'error',
       
      // Disable base rule to prevent overload false positives
      'no-redeclare': 'off',
      // TS-aware version handles overloads correctly
      '@typescript-eslint/no-redeclare': 'error',
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      '@eslint-react/dom/no-missing-button-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
