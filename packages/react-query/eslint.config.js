// @ts-check

import pluginReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...pluginReact.configs.recommended,
    rules: {
      '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/incompatible-library': 'error',
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
