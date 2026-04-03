import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginReact from '@eslint-react/eslint-plugin'

export default [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  pluginReact.configs.recommended,
]
