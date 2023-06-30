// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.js'

export default defineConfig(
  buildConfigs({
    name: 'query-sync-storage-persister',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
)
