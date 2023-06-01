// @ts-check

import { resolve } from 'node:path'
import { babel } from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import size from 'rollup-plugin-size'
import { visualizer } from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import withSolid from 'rollup-preset-solid'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import { rootDir } from './config.mjs'

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
    configFile: resolve(rootDir, 'babel.config.cjs'),
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
 * @param {string} opts.name - The name.
 * @param {string} opts.jsName - The JavaScript name.
 * @param {string} opts.outputFile - The output file.
 * @param {string} opts.entryFile - The entry file.
 * @param {Record<string, string>} opts.globals - The globals record.
 * @param {string[]} [opts.bundleUMDGlobals] - List of dependencies to bundle for UMD build.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @param {boolean} [opts.skipUmdBuild] - Flag indicating whether to skip UMD build.
 * @returns {import('rollup').RollupOptions[]}
 */
export function buildConfigs(opts) {
  const firstEntry = opts.entryFile
  const input = [opts.entryFile]
  const externalDeps = Object.keys(opts.globals)

  const bundleUMDGlobals = opts.bundleUMDGlobals || []
  const umdExternal = externalDeps.filter(
    (external) => !bundleUMDGlobals.includes(external),
  )

  /** @type {import('./types').Options} */
  const options = {
    input,
    jsName: opts.jsName,
    outputFile: opts.outputFile,
    external: (moduleName) => externalDeps.includes(moduleName),
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
 * @param {import('./types').Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function mjs({ input, external, outputFile, forceDevEnv, forceBundle }) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'esm',
    file: `./build/lib/${outputFile}.mjs`,
    sourcemap: true,
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'esm',
    dir: `./build/lib`,
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
      preserveDirectives(),
    ],
  }
}

/**
 * @param {import('./types').Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function esm({ input, external, outputFile, forceDevEnv, forceBundle }) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'esm',
    file: `./build/lib/${outputFile}.esm.js`,
    sourcemap: true,
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'esm',
    dir: `./build/lib`,
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
      preserveDirectives(),
    ],
  }
}

/**
 * @param {import('./types').Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function cjs({ input, external, outputFile, forceDevEnv, forceBundle }) {
  /** @type {import('rollup').OutputOptions} */
  const bundleOutput = {
    format: 'cjs',
    file: `./build/lib/${outputFile}.js`,
    sourcemap: true,
    exports: 'named',
  }

  /** @type {import('rollup').OutputOptions} */
  const normalOutput = {
    format: 'cjs',
    dir: `./build/lib`,
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
      preserveDirectives(),
    ],
  }
}

/**
 * @param {import('./types').Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function umdDev({ input, external, outputFile, globals, jsName }) {
  return {
    // UMD (Dev)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `./build/umd/${outputFile}.development.js`,
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
 * @param {import('./types').Options} options - Options for building configurations.
 * @returns {import('rollup').RollupOptions}
 */
function umdProd({ input, external, outputFile, globals, jsName }) {
  return {
    // UMD (Prod)
    external,
    input,
    output: {
      format: 'umd',
      sourcemap: true,
      file: `./build/umd/${outputFile}.production.js`,
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
      size({}),
      visualizer({
        filename: `./build/stats-html.html`,
        template: 'treemap',
        gzipSize: true,
      }),
      visualizer({
        filename: `./build/stats.json`,
        template: 'raw-data',
        gzipSize: true,
      }),
    ],
  }
}

export function createSolidQueryConfig() {
  const solidRollupOptions = /** @type {import('rollup').RollupOptions} */ (
    withSolid({
      input: `./src/index.ts`,
      targets: ['esm', 'cjs', 'umd'],
      external: ['@tanstack/query-core'],
    })
  )

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
    output.dir = `./build/${format}`
  })

  const plugins = /** @type {import('rollup').Plugin[]} */ (
    solidRollupOptions.plugins
  )
  // Prevent types generation since it doesn't resolve the directory correctly
  // Instead build:types will generate those types anyway
  const filtered = plugins.filter((plugin) => plugin.name !== 'ts')

  solidRollupOptions.plugins = filtered

  return solidRollupOptions
}

export function createTanstackQueryDevtoolsConfig() {
  const solidRollupOptions = /** @type {import('rollup').RollupOptions} */ (
    withSolid({
      input: `./src/index.tsx`,
      targets: ['esm', 'cjs', 'umd'],
    })
  )

  const outputs = !solidRollupOptions.output
    ? []
    : Array.isArray(solidRollupOptions.output)
    ? solidRollupOptions.output
    : [solidRollupOptions.output]

  outputs.forEach((output) => {
    const format = output.format
    output.dir = `./build/${format}`
    if (output.format === 'esm') {
      output.dir = undefined
      output.file = `./build/${format}/index.mjs`
    }
  })

  solidRollupOptions.external = []

  const plugins = /** @type {import('rollup').Plugin[]} */ (
    solidRollupOptions.plugins
  )
  // Prevent types generation since it doesn't resolve the directory correctly
  // Instead build:types will generate those types anyway
  const filtered = plugins.filter((plugin) => plugin.name !== 'ts')

  solidRollupOptions.plugins = filtered

  return solidRollupOptions
}
