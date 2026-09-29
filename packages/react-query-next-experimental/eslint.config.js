// @ts-check

import pluginReact from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import rootConfig from './root.eslint.config.js'

export default [
  ...rootConfig,
  reactHooks.configs.flat.recommended,
  pluginReact.configs.recommended,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/incompatible-library': 'error',
      '@eslint-react/no-context-provider': 'off', // We need to be React 18 compatible
      '@eslint-react/no-use-context': 'off', // We need to be React 18 compatible
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
      // Covered by 'eslint-plugin-react-hooks'
      '@eslint-react/error-boundaries': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/globals': 'off',
      '@eslint-react/immutability': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/refs': 'off',
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-render': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/use-memo': 'off',
    },
  },
]
