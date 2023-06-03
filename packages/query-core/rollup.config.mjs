// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-core',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
)
