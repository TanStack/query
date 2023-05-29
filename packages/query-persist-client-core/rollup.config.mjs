// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig([
  ...buildConfigs({
    name: 'query-persist-client-core',
    packageDir: '.',
    jsName: 'QueryPersistClientCore',
    outputFile: 'index',
    entryFile: ['src/index.ts'],
    globals: {
      '@tanstack/query-core': 'QueryCore',
    },
  }),
])
