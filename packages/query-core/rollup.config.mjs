// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'query-core',
    packageDir: '.',
    jsName: 'QueryCore',
    outputFile: 'index',
    entryFile: ['src/index.ts'],
    globals: {},
  }),
)
