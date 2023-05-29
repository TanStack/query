// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-broadcast-client-experimental',
    packageDir: '.',
    jsName: 'QueryBroadcastClient',
    outputFile: 'index',
    entryFile: 'src/index.ts',
    globals: {
      '@tanstack/query-core': 'QueryCore',
      'broadcast-channel': 'BroadcastChannel',
    },
  }),
)
