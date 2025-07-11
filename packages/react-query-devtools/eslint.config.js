// @ts-check

import pluginReact from '@eslint-react/eslint-plugin'
import * as reactHooks from 'eslint-plugin-react-hooks'

// @ts-ignore out of scope
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
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/react-compiler': 'error',
    },
  },
]
