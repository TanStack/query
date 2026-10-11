import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginSolid from 'eslint-plugin-solid/configs/typescript'

export default [
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  pluginSolid,
]
