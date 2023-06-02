// @ts-check

import { resolve } from 'node:path'
import { babel } from '@rollup/plugin-babel'
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

const babelPlugin = () =>
  babel({
    configFile: resolve(rootDir, 'babel.config.cjs'),
    browserslistConfigFile: true,
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
 * @returns {import('rollup').RollupOptions}
 */
export function buildConfigs(opts) {
  const input = [opts.entryFile]
  const externalDeps = Object.keys(opts.globals)
  const forceDevEnv = opts.forceDevEnv || false
  const forceBundle = opts.forceBundle || false

  /** @type {import('rollup').OutputOptions[]} */
  const bundleOutput = [
    {
      format: 'esm',
      file: `./build/lib/${opts.outputFile}.mjs`,
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: `./build/lib/${opts.outputFile}.js`,
      sourcemap: true,
      exports: 'named',
    },
  ]

  /** @type {import('rollup').OutputOptions[]} */
  const normalOutput = [
    {
      format: 'esm',
      dir: `./build/lib`,
      sourcemap: true,
      preserveModules: true,
      entryFileNames: '[name].mjs',
    },
    {
      format: 'cjs',
      dir: `./build/lib`,
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].js',
    }
  ]

  return {
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    external: (moduleName) => externalDeps.includes(moduleName),
    plugins: [
      commonJS(),
      babelPlugin(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      preserveDirectives(),
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
