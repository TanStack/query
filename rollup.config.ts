import { RollupOptions } from 'rollup'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import path from 'path'
import svelte from 'rollup-plugin-svelte'

type Options = {
  input: string | string[]
  packageDir: string
  external: RollupOptions['external']
  banner: string
  jsName: string
  outputFile: string
  globals: Record<string, string>
  forceDevEnv: boolean
}

const forceEnvPlugin = (type: 'development' | 'production') =>
  replace({
    'process.env.NODE_ENV': `"${type}"`,
    delimiters: ['', ''],
    preventAssignment: true,
  })

const babelPlugin = babel({
  babelHelpers: 'bundled',
  exclude: /node_modules/,
  extensions: ['.ts', '.tsx', '.native.ts'],
})

export default function rollup(options: RollupOptions): RollupOptions[] {
  return [
    ...buildConfigs({
      name: 'query-core',
      packageDir: 'packages/query-core',
      jsName: 'QueryCore',
      outputFile: 'index',
      entryFile: ['src/index.ts', 'src/logger.native.ts'],
      globals: {},
    }),
    ...buildConfigs({
      name: 'query-async-storage-persister',
      packageDir: 'packages/query-async-storage-persister',
      jsName: 'QueryAsyncStoragePersister',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/react-query-persist-client': 'ReactQueryPersistClient',
      },
    }),
    ...buildConfigs({
      name: 'query-broadcast-client-experimental',
      packageDir: 'packages/query-broadcast-client-experimental',
      jsName: 'QueryBroadcastClient',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/query-core': 'QueryCore',
        'broadcast-channel': 'BroadcastChannel',
      },
    }),
    ...buildConfigs({
      name: 'query-sync-storage-persister',
      packageDir: 'packages/query-sync-storage-persister',
      jsName: 'QuerySyncStoragePersister',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/react-query-persist-client': 'ReactQueryPersistClient',
      },
    }),
    ...buildConfigs({
      name: 'react-query',
      packageDir: 'packages/react-query',
      jsName: 'ReactQuery',
      outputFile: 'index',
      entryFile: ['src/index.ts', 'src/reactBatchedUpdates.native.ts'],
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/query-core': 'QueryCore',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
        'react-native': 'ReactNative',
      },
      bundleUMDGlobals: [
        '@tanstack/query-core',
        'use-sync-external-store/shim/index.js',
      ],
    }),
    ...buildConfigs({
      name: 'react-query-devtools',
      packageDir: 'packages/react-query-devtools',
      jsName: 'ReactQueryDevtools',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/react-query': 'ReactQuery',
        '@tanstack/match-sorter-utils': 'MatchSorterUtils',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
      },
      bundleUMDGlobals: [
        '@tanstack/match-sorter-utils',
        'use-sync-external-store/shim/index.js',
      ],
    }),
    ...buildConfigs({
      name: 'react-query-devtools-prod',
      packageDir: 'packages/react-query-devtools',
      jsName: 'ReactQueryDevtools',
      outputFile: 'index.prod',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/react-query': 'ReactQuery',
        '@tanstack/match-sorter-utils': 'MatchSorterUtils',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
      },
      forceDevEnv: true,
      skipUmdBuild: true,
    }),
    ...buildConfigs({
      name: 'react-query-persist-client',
      packageDir: 'packages/react-query-persist-client',
      jsName: 'ReactQueryPersistClient',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        '@tanstack/query-core': 'QueryCore',
        '@tanstack/react-query': 'ReactQuery',
      },
    }),
  ]
}

function buildConfigs(opts: {
  packageDir: string
  name: string
  jsName: string
  outputFile: string
  entryFile: string | string[]
  globals: Record<string, string>
  // This option allows to bundle specified dependencies for umd build
  bundleUMDGlobals?: string[]
  // Force prod env build
  forceDevEnv?: boolean
  skipUmdBuild?: boolean
}): RollupOptions[] {
  const firstEntry = path.resolve(
    opts.packageDir,
    Array.isArray(opts.entryFile) ? opts.entryFile[0] : opts.entryFile,
  )
  const entries = Array.isArray(opts.entryFile)
    ? opts.entryFile
    : [opts.entryFile]
  const input = entries.map((entry) => path.resolve(opts.packageDir, entry))
  const externalDeps = Object.keys(opts.globals)

  const bundleUMDGlobals = opts.bundleUMDGlobals || []
  const umdExternal = externalDeps.filter(
    (external) => !bundleUMDGlobals.includes(external),
  )

  const external = (moduleName) => externalDeps.includes(moduleName)
  const banner = '' //createBanner(opts.name)

  const options: Options = {
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    packageDir: opts.packageDir,
    external,
    banner,
    globals: opts.globals,
    forceDevEnv: opts.forceDevEnv || false,
  }

  let builds = [esm(options), cjs(options)]

  if (!opts.skipUmdBuild) {
    builds = builds.concat([
      umdDev({ ...options, external: umdExternal, input: firstEntry }),
      umdProd({ ...options, external: umdExternal, input: firstEntry }),
    ])
  }

  return builds
}

function esm({
  input,
  packageDir,
  external,
  banner,
  outputFile,
  forceDevEnv,
}: Options): RollupOptions {
  return {
    // ESM
    external,
    input,
    output: {
      format: 'esm',
      // file: `${packageDir}/build/lib/${outputFile}.mjs`,
      dir: `${packageDir}/build/lib`,
      sourcemap: true,
      banner,
      preserveModules: true,
      entryFileNames: '[name].mjs',
    },
    plugins: [
      svelte(),
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
    ],
  }
}

function cjs({
  input,
  external,
  packageDir,
  banner,
  outputFile,
  forceDevEnv,
}: Options): RollupOptions {
  return {
    // CJS
    external,
    input,
    output: {
      format: 'cjs',
      // file: `${packageDir}/build/lib/${outputFile}.js`,
      dir: `${packageDir}/build/lib`,
      sourcemap: true,
      exports: 'named',
      banner,
      preserveModules: true,
      entryFileNames: '[name].js',
    },
    plugins: [
      svelte(),
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      replace({
        // TODO: figure out a better way to produce extensionless cjs imports
        "require('./logger.js')": "require('./logger')",
        "require('./reactBatchedUpdates.js')": "require('./reactBatchedUpdates')",
        preventAssignment: true,
        delimiters: ['', ''],
      }),
    ],
  }
}

function umdDev({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  banner,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Dev)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/${outputFile}.development.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      commonJS(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceEnvPlugin('development'),
    ],
  }
}

function umdProd({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  banner,
  jsName,
}: Options): RollupOptions {
  return {
    // UMD (Prod)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `${packageDir}/build/umd/${outputFile}.production.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      commonJS(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceEnvPlugin('production'),
      terser({
        mangle: true,
        compress: true,
      }),
      size({}),
      visualizer({
        filename: `${packageDir}/build/stats-html.html`,
        gzipSize: true,
      }),
      visualizer({
        filename: `${packageDir}/build/stats.json`,
        json: true,
        gzipSize: true,
      }),
    ],
  }
}

function createBanner(libraryName: string) {
  return `/**
 * ${libraryName}
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`
}
