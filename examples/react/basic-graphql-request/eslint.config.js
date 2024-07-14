import { tanstackConfig } from '@tanstack/config/eslint'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginReact from '@eslint-react/eslint-plugin'
import pluginReactHooks from 'eslint-plugin-react-hooks'

export default [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  pluginReact.configs.recommended,
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
]
