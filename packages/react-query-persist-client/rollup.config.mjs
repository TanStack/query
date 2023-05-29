// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'react-query-persist-client',
    jsName: 'ReactQueryPersistClient',
    outputFile: 'index',
    entryFile: './src/index.ts',
    globals: {
      react: 'React',
      '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
      '@tanstack/react-query': 'ReactQuery',
    },
    bundleUMDGlobals: ['@tanstack/query-persist-client-core'],
  }),
)
