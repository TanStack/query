import path from 'path'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import type { OutputOptions, RollupOptions } from 'rollup'

type Options = {
  input: string | string[]
  packageDir: string
  external: RollupOptions['external']
  banner: string
  jsName: string
  outputFile: string
  globals: Record<string, string>
  forceDevEnv: boolean
  forceBundle: boolean
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
      name: 'query-persist-client-core',
      packageDir: 'packages/query-persist-client-core',
      jsName: 'QueryPersistClientCore',
      outputFile: 'index',
      entryFile: ['src/index.ts'],
      globals: {
        '@tanstack/query-core': 'QueryCore',
      },
    }),
    ...buildConfigs({
      name: 'query-async-storage-persister',
      packageDir: 'packages/query-async-storage-persister',
      jsName: 'QueryAsyncStoragePersister',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
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
        '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
      },
    }),
    ...buildConfigs({
      name: 'react-query',
      packageDir: 'packages/react-query',
      jsName: 'ReactQuery',
      outputFile: 'index',
      entryFile: [
        'src/index.ts',
        'src/reactBatchedUpdates.native.ts',
        'src/useSyncExternalStore.native.ts',
      ],
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@tanstack/query-core': 'QueryCore',
        'use-sync-external-store/shim/index.js': 'UseSyncExternalStore',
        'use-sync-external-store/shim/index.native.js':
          'UseSyncExternalStoreNative',
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
        superjson: 'SuperJson',
      },
      bundleUMDGlobals: [
        '@tanstack/match-sorter-utils',
        'use-sync-external-store/shim/index.js',
        'superjson',
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
        superjson: 'SuperJson',
      },
      forceDevEnv: true,
      forceBundle: true,
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
        '@tanstack/query-persist-client-core': 'QueryPersistClientCore',
        '@tanstack/react-query': 'ReactQuery',
      },
      bundleUMDGlobals: ['@tanstack/query-persist-client-core'],
    }),
    ...buildConfigs({
      name: 'solid-query',
      packageDir: 'packages/solid-query',
      jsName: 'SolidQuery',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        'solid-js/store': 'SolidStore',
        'solid-js': 'Solid',
        '@tanstack/query-core': 'QueryCore',
      },
      bundleUMDGlobals: ['@tanstack/query-core'],
    }),
    ...buildConfigs({
      name: 'vue-query',
      packageDir: 'packages/vue-query',
      jsName: 'VueQuery',
      outputFile: 'index',
      entryFile: 'src/index.ts',
      globals: {
        '@tanstack/query-core': 'QueryCore',
        vue: 'Vue',
        'vue-demi': 'Vue',
        '@tanstack/match-sorter-utils': 'MatchSorter',
        '@vue/devtools-api': 'DevtoolsApi',
      },
      bundleUMDGlobals: [
        '@tanstack/query-core',
        '@tanstack/match-sorter-utils',
        '@vue/devtools-api',
      ],
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
  forceBundle?: boolean
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
    forceBundle: opts.forceBundle || false,
  }

  let builds = [mjs(options), esm(options), cjs(options)]

  if (!opts.skipUmdBuild) {
    builds = builds.concat([
      umdDev({ ...options, external: umdExternal, input: firstEntry }),
      umdProd({ ...options, external: umdExternal, input: firstEntry }),
    ])
  }

  return builds
}

function mjs({
  input,
  packageDir,
  external,
  banner,
  outputFile,
  forceDevEnv,
  forceBundle,
}: Options): RollupOptions {
  const bundleOutput: OutputOptions = {
    format: 'esm',
    file: `${packageDir}/build/lib/${outputFile}.mjs`,
    sourcemap: true,
    banner,
  }

  const normalOutput: OutputOptions = {
    format: 'esm',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    banner,
    preserveModules: true,
    entryFileNames: '[name].mjs',
  }

  return {
    // ESM
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      preserveDirectives(),
    ],
  }
}

function esm({
  input,
  packageDir,
  external,
  banner,
  outputFile,
  forceDevEnv,
  forceBundle,
}: Options): RollupOptions {
  const bundleOutput: OutputOptions = {
    format: 'esm',
    file: `${packageDir}/build/lib/${outputFile}.esm.js`,
    sourcemap: true,
    banner,
  }

  const normalOutput: OutputOptions = {
    format: 'esm',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    banner,
    preserveModules: true,
    entryFileNames: '[name].esm.js',
  }

  return {
    // ESM
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      preserveDirectives(),
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
  forceBundle,
}: Options): RollupOptions {
  const bundleOutput: OutputOptions = {
    format: 'cjs',
    file: `${packageDir}/build/lib/${outputFile}.js`,
    sourcemap: true,
    exports: 'named',
    banner,
  }

  const normalOutput: OutputOptions = {
    format: 'cjs',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    exports: 'named',
    banner,
    preserveModules: true,
    entryFileNames: '[name].js',
  }

  return {
    // CJS
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin,
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      replace({
        // TODO: figure out a better way to produce extensionless cjs imports
        "require('./logger.js')": "require('./logger')",
        "require('./reactBatchedUpdates.js')":
          "require('./reactBatchedUpdates')",
        "require('./useSyncExternalStore.js')":
          "require('./useSyncExternalStore')",
        preventAssignment: true,
        delimiters: ['', ''],
      }),
      preserveDirectives(),
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
