import { resolve } from 'node:path'
import { fileURLToPath } from "node:url"
import { defineConfig } from 'rollup'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import { visualizer } from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import withSolid from 'rollup-preset-solid'
// import preserveDirectives from 'rollup-plugin-preserve-directives'

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * @typedef {Object} Options
 * @property {string | string[]} input - The input string or array of strings.
 * @property {string} packageDir - The package directory.
 * @property {import('rollup').RollupOptions['external']} external - The external options of Rollup.
 * @property {string} jsName - The JavaScript name.
 * @property {string} outputFile - The output file.
 * @property {Record<string, string>} globals - The globals record.
 * @property {boolean} forceDevEnv - Flag indicating whether to force development environment.
 * @property {boolean} forceBundle - Flag indicating whether to force bundling.
 */

/** @param {'development' | 'production'} type */
const forceEnvPlugin = (type) =>
  replace({
    'process.env.NODE_ENV': `"${type}"`,
    delimiters: ['', ''],
    preventAssignment: true,
  })

/** @param {'legacy' | 'modern'} type */
const babelPlugin = (type) =>
  babel({
    configFile: resolve(__dirname, 'babel.config.js'),
    browserslistConfigFile: type === 'modern' ? true : false,
    targets:
      type === 'modern'
        ? ''
        : {
            chrome: '73',
            firefox: '78',
            edge: '79',
            safari: '12',
            ios: '12',
            opera: '53',
          },
    babelHelpers: 'bundled',
    exclude: /node_modules/,
    extensions: ['.ts', '.tsx', '.native.ts'],
  })

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string} opts.packageDir - The package directory.
 * @param {string} opts.name - The name.
 * @param {string} opts.jsName - The JavaScript name.
 * @param {string} opts.outputFile - The output file.
 * @param {string | string[]} opts.entryFile - The entry file or array of entry files.
 * @param {Record<string, string>} opts.globals - The globals record.
 * @param {string[]} [opts.bundleUMDGlobals] - List of dependencies to bundle for UMD build.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @param {boolean} [opts.skipUmdBuild] - Flag indicating whether to skip UMD build.
 * @returns {import('rollup').RollupOptions[]}
 */
export function buildConfigs(opts) {
  const firstEntry = resolve(
    opts.packageDir,
    Array.isArray(opts.entryFile) ? opts.entryFile[0] : opts.entryFile,
  )
  const entries = Array.isArray(opts.entryFile)
    ? opts.entryFile
    : [opts.entryFile]
  const input = entries.map((entry) => resolve(opts.packageDir, entry))
  const externalDeps = Object.keys(opts.globals)

  const bundleUMDGlobals = opts.bundleUMDGlobals || []
  const umdExternal = externalDeps.filter(
    (external) => !bundleUMDGlobals.includes(external),
  )

  const external = (moduleName) => externalDeps.includes(moduleName)

  /** @type {Options} */
  const options = {
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    packageDir: opts.packageDir,
    external,
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

/**
 * @param {Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function mjs({
  input,
  packageDir,
  external,
  outputFile,
  forceDevEnv,
  forceBundle,
}) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'esm',
    file: `${packageDir}/build/lib/${outputFile}.mjs`,
    sourcemap: true,
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'esm',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    preserveModules: true,
    entryFileNames: '[name].mjs',
  }

  return {
    // MJS
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin('modern'),
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      // preserveDirectives(),
    ],
  }
}

/**
 * @param {Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function esm({
  input,
  packageDir,
  external,
  outputFile,
  forceDevEnv,
  forceBundle,
}) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'esm',
    file: `${packageDir}/build/lib/${outputFile}.esm.js`,
    sourcemap: true,
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'esm',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    preserveModules: true,
    entryFileNames: '[name].esm.js',
  }

  return {
    // ESM
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin('legacy'),
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      // preserveDirectives(),
    ],
  }
}

/**
 * @param {Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function cjs({
  input,
  external,
  packageDir,
  outputFile,
  forceDevEnv,
  forceBundle,
}) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'cjs',
    file: `${packageDir}/build/lib/${outputFile}.js`,
    sourcemap: true,
    exports: 'named',
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'cjs',
    dir: `${packageDir}/build/lib`,
    sourcemap: true,
    exports: 'named',
    preserveModules: true,
    entryFileNames: '[name].js',
  }

  return {
    // CJS
    external,
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      babelPlugin('legacy'),
      commonJS(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      // preserveDirectives(),
    ],
  }
}

/**
 * @param {Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function umdDev({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  jsName,
}) {
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
    },
    plugins: [
      commonJS(),
      babelPlugin('modern'),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceEnvPlugin('development'),
    ],
  }
}

/**
 * @param {Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function umdProd({
  input,
  external,
  packageDir,
  outputFile,
  globals,
  jsName,
}) {
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
    },
    plugins: [
      commonJS(),
      babelPlugin('modern'),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceEnvPlugin('production'),
      terser({
        mangle: true,
        compress: true,
      }),
      visualizer({
        filename: `${packageDir}/build/stats-html.html`,
        template: 'treemap',
        gzipSize: true,
      }),
      visualizer({
        filename: `${packageDir}/build/stats.json`,
        template: 'raw-data',
        gzipSize: true,
      }),
    ],
  }
}

function createSolidQueryConfig() {
  const packageDir = 'packages/solid-query'
  const solidRollupOptions = /** @type {import('rollup').RollupOptions} */ (withSolid({
    input: `${packageDir}/src/index.ts`,
    targets: ['esm', 'cjs', 'umd'],
    external: ['@tanstack/query-core'],
  }))

  const outputs = !solidRollupOptions.output
    ? []
    : Array.isArray(solidRollupOptions.output)
    ? solidRollupOptions.output
    : [solidRollupOptions.output]

  outputs.forEach((output) => {
    const format = output.format
    if (format === 'umd') {
      output.globals = {
        'solid-js/store': 'SolidStore',
        'solid-js/web': 'SolidWeb',
        'solid-js': 'Solid',
        '@tanstack/query-core': 'QueryCore',
      }
    }
    output.dir = `${packageDir}/build/${format}`
  })

  const plugins = /** @type {import('rollup').Plugin[]} */ (solidRollupOptions.plugins)
  // Prevent types generation since it doesn't resolve the directory correctly
  // Instead build:types will generate those types anyway
  const filtered = plugins.filter((plugin) => plugin.name !== 'ts')

  solidRollupOptions.plugins = filtered

  return solidRollupOptions
}

function createTanstackQueryDevtoolsConfig() {
  const packageDir = 'packages/query-devtools'
  const solidRollupOptions = /** @type {import('rollup').RollupOptions} */ (withSolid({
    input: `${packageDir}/src/index.tsx`,
    targets: ['esm', 'cjs', 'umd'],
  }))

  const outputs = !solidRollupOptions.output
    ? []
    : Array.isArray(solidRollupOptions.output)
    ? solidRollupOptions.output
    : [solidRollupOptions.output]

  outputs.forEach((output) => {
    const format = output.format
    output.dir = `${packageDir}/build/${format}`
    if (output.format === 'esm') {
      output.dir = undefined
      output.file = `${packageDir}/build/${format}/index.mjs`
    }
  })

  solidRollupOptions.external = []

  const plugins = /** @type {import('rollup').Plugin[]} */ (solidRollupOptions.plugins)
  // Prevent types generation since it doesn't resolve the directory correctly
  // Instead build:types will generate those types anyway
  const filtered = plugins.filter((plugin) => plugin.name !== 'ts')

  solidRollupOptions.plugins = filtered

  return solidRollupOptions
}

export default defineConfig([
  createTanstackQueryDevtoolsConfig(),
  ...buildConfigs({
    name: 'query-core',
    packageDir: 'packages/query-core',
    jsName: 'QueryCore',
    outputFile: 'index',
    entryFile: ['src/index.ts'],
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
    entryFile: ['src/index.ts'],
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      '@tanstack/query-core': 'QueryCore',
      'react-native': 'ReactNative',
    },
    bundleUMDGlobals: ['@tanstack/query-core'],
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
      '@tanstack/query-devtools': 'TanstackQueryDevtools',
    },
    bundleUMDGlobals: ['@tanstack/query-devtools'],
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
  createSolidQueryConfig(),
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
])
