// @ts-check

import pluginReact from '@eslint-react/eslint-plugin'
import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  pluginReact.configs.recommended,
])
