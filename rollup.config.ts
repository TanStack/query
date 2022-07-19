import { RollupOptions } from 'rollup'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import path from 'path'
import svelte from 'rollup-plugin-svelte'

type Options = {
  input: string
  packageDir: string
  external: RollupOptions['external']
  banner: string
  jsName: string
  outputFile: string
  globals: Record<string, string>
}

const umdDevPlugin = (type: 'development' | 'production') =>
  replace({
    'process.env.NODE_ENV': `"${type}"`,
    delimiters: ['', ''],
    preventAssignment: true,
  })

const babelPlugin = babel({
  babelHelpers: 'bundled',
  exclude: /node_modules/,
  extensions: ['.ts', '.tsx'],
})

export default function rollup(options: RollupOptions): RollupOptions[] {
  return [
    ...buildConfigs({
      name: 'query-core',
      packageDir: 'packages/query-core',
      jsName: 'QueryCore',
      outputFile: 'query-core',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      name: 'query-async-storage-persister',
      packageDir: 'packages/query-async-storage-persister',
      jsName: 'QueryAsyncStoragePersister',
      outputFile: 'query-async-storage-persister',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      name: 'query-broadcast-client-experimental',
      packageDir: 'packages/query-broadcast-client-experimental',
      jsName: 'QueryBroadcastClient',
      outputFile: 'query-broadcast-client-experimental',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      name: 'query-sync-storage-persister',
      packageDir: 'packages/query-sync-storage-persister',
      jsName: 'QuerySyncStoragePersister',
      outputFile: 'query-sync-storage-persister',
      entryFile: 'src/index.ts',
      globals: {},
    }),
    ...buildConfigs({
      name: 'react-query',
      packageDir: 'packages/react-query',
      jsName: 'ReactQuery',
      outputFile: 'react-query',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
      },
    }),
    ...buildConfigs({
      name: 'react-query-devtools',
      packageDir: 'packages/react-query-devtools',
      jsName: 'ReactQueryDevtools',
      outputFile: 'react-query-devtools',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
        '@tanstack/react-query': 'ReactQuery',
      },
    }),
    ...buildConfigs({
      name: 'react-query-persist-client',
      packageDir: 'packages/react-query-persist-client',
      jsName: 'ReactQueryPersistClient',
      outputFile: 'react-query-persist-client',
      entryFile: 'src/index.ts',
      globals: {
        react: 'React',
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
  entryFile: string
  globals: Record<string, string>
}): RollupOptions[] {
  const input = path.resolve(opts.packageDir, opts.entryFile)
  const externalDeps = Object.keys(opts.globals)

  const external = (moduleName) => externalDeps.includes(moduleName)
  const banner = createBanner(opts.name)

  const options: Options = {
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    packageDir: opts.packageDir,
    external,
    banner,
    globals: opts.globals,
  }

  return [esm(options), cjs(options), umdDev(options), umdProd(options)]
}

function esm({ input, packageDir, external, banner }: Options): RollupOptions {
  return {
    // ESM
    external,
    input,
    output: {
      format: 'esm',
      sourcemap: true,
      dir: `${packageDir}/build/esm`,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  }
}

function cjs({ input, external, packageDir, banner }: Options): RollupOptions {
  return {
    // CJS
    external,
    input,
    output: {
      format: 'cjs',
      sourcemap: true,
      dir: `${packageDir}/build/cjs`,
      preserveModules: true,
      exports: 'named',
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
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
      file: `${packageDir}/build/umd/index.development.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      umdDevPlugin('development'),
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
      file: `${packageDir}/build/umd/index.production.js`,
      name: jsName,
      globals,
      banner,
    },
    plugins: [
      svelte(),
      babelPlugin,
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      umdDevPlugin('production'),
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
