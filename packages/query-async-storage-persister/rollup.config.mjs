// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig([
  ...buildConfigs({
    name: 'query-async-storage-persister',
    packageDir: '.',
    jsName: 'QueryAsyncStoragePersister',
    outputFile: 'index',
    entryFile: 'src/index.ts',
    globals: {
      '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
    },
  }),
])
