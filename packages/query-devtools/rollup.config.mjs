// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-devtools',
    outputFile: 'index',
    entryFile: './src/index.tsx',
    forceBundle: true,
    bundleDeps: true,
  }),
)
