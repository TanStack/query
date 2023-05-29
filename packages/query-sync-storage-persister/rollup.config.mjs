// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-sync-storage-persister',
    jsName: 'QuerySyncStoragePersister',
    outputFile: 'index',
    entryFile: './src/index.ts',
    globals: {
      '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
    },
  }),
)
