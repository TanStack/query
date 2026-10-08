// @ts-check

import pluginSolid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([
  ...rootConfig,
  pluginSolid,
  {
    rules: {
      'solid/reactivity': 'off', // Reads signals outside tracked scopes on purpose (initial snapshots, subscription callbacks)
    },
  },
])
