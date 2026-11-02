// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginSolid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { ignores: ['src/env.d.ts'] },
  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended-strict'],
  pluginSolid,
])
