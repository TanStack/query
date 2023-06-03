// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.js'

export default defineConfig([
  buildConfigs({
    name: 'react-query-devtools',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
  buildConfigs({
    name: 'react-query-devtools-prod',
    outputFile: 'index.prod',
    entryFile: './src/index.ts',
    forceDevEnv: true,
    forceBundle: true,
  }),
])
