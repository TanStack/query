import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [...tanstackConfig, ...pluginQuery.configs['flat/recommended']]
