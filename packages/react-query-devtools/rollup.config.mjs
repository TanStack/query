// @ts-check

import { defineConfig } from 'rollup'
import { buildConfigs } from "../../scripts/getRollupConfig.mjs"

export default defineConfig([
  ...buildConfigs({
    name: 'react-query-devtools',
    packageDir: '.',
    jsName: 'ReactQueryDevtools',
    outputFile: 'index',
    entryFile: 'src/index.ts',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      '@tanstack/react-query': 'ReactQuery',
      '@tanstack/query-devtools': 'TanstackQueryDevtools',
    },
    bundleUMDGlobals: ['@tanstack/query-devtools'],
  }),
  ...buildConfigs({
    name: 'react-query-devtools-prod',
    packageDir: '.',
    jsName: 'ReactQueryDevtools',
    outputFile: 'index.prod',
    entryFile: 'src/index.ts',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      '@tanstack/react-query': 'ReactQuery',
      '@tanstack/match-sorter-utils': 'MatchSorterUtils',
      superjson: 'SuperJson',
    },
    forceDevEnv: true,
    forceBundle: true,
    skipUmdBuild: true,
  }),
])
