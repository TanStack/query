import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
// @ts-ignore: no types for eslint-config-preact
import preact from 'eslint-config-preact'

export default [
  ...preact,
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
]
