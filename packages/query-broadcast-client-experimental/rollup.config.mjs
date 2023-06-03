// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-broadcast-client-experimental',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
)
