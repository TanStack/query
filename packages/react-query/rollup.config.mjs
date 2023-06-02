// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(
  buildConfigs({
    name: 'react-query',
    jsName: 'ReactQuery',
    outputFile: 'index',
    entryFile: './src/index.ts',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      '@tanstack/query-core': 'QueryCore',
      'react-native': 'ReactNative',
    },
  }),
)
