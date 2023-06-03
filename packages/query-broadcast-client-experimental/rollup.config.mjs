// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-broadcast-client-experimental',
    jsName: 'QueryBroadcastClient',
    outputFile: 'index',
    entryFile: './src/index.ts',
  }),
)
