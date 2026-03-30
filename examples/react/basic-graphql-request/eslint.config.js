import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginReact from '@eslint-react/eslint-plugin'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  pluginReact.configs.recommended,
]

export default config
