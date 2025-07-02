// @ts-check

import pluginReact from '@eslint-react/eslint-plugin'
import * as reactHooks from 'eslint-plugin-react-hooks'

// @ts-ignore out of range
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  reactHooks.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...pluginReact.configs.recommended,
    rules: {
      '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
    },
  },
  {
    rules: {
      '@eslint-react/dom/no-missing-button-type': 'off',
      'react-hooks/react-compiler': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'react-hooks/react-compiler': 'off',
    },
  },
]
