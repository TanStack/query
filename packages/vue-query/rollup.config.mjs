// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'vue-query',
    jsName: 'VueQuery',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
)
