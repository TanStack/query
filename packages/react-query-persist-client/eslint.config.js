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
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/incompatible-library': 'error',
    },
  },
]
