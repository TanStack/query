// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig([
  buildConfigs({
    name: 'react-query-devtools',
    jsName: 'ReactQueryDevtools',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
  buildConfigs({
    name: 'react-query-devtools-prod',
    jsName: 'ReactQueryDevtools',
    outputFile: 'index.prod',
    entryFile: './src/index.ts',
    forceDevEnv: true,
    forceBundle: true,
  }),
])
