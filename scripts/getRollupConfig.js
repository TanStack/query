// @ts-check

import { resolve } from 'node:path'
import { babel } from '@rollup/plugin-babel'
import { visualizer } from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import externals from 'rollup-plugin-node-externals'
import preserveDirectives from 'rollup-plugin-preserve-directives'
import { rootDir } from './config.js'

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
    extensions: ['.ts', '.tsx'],
  })

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string} opts.name - The name.
 * @param {string} opts.outputFile - The output file.
 * @param {string} opts.entryFile - The entry file.
 * @param {boolean} [opts.bundleDeps] - Flag indicating whether to make all deps external.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @returns {import('rollup').RollupOptions[]}
 */
export function buildConfigs(opts) {
  return [modernConfig(opts), legacyConfig(opts)]
}

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string} opts.name - The name.
 * @param {string} opts.outputFile - The output file.
 * @param {string} opts.entryFile - The entry file.
 * @param {boolean} [opts.bundleDeps] - Flag indicating whether to make all deps external.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @returns {import('rollup').RollupOptions}
 */
function modernConfig(opts) {
  const forceDevEnv = opts.forceDevEnv || false
  const forceBundle = opts.forceBundle || false
  const bundleDeps = opts.bundleDeps || false

  /** @type {import('rollup').OutputOptions[]} */
  const bundleOutput = [
    {
      format: 'esm',
      file: `./build/lib/${opts.outputFile}.js`,
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: `./build/lib/${opts.outputFile}.cjs`,
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
      entryFileNames: '[name].js',
    },
    {
      format: 'cjs',
      dir: `./build/lib`,
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].cjs',
    },
  ]

  return {
    input: [opts.entryFile],
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      commonJS(),
      babelPlugin('modern'),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      bundleDeps
        ? undefined
        : externals({
            packagePath: './package.json',
            deps: true,
            devDeps: true,
            peerDeps: true,
          }),
      preserveDirectives(),
      visualizer({
        filename: `./build/stats.html`,
        template: 'treemap',
        gzipSize: true,
      }),
    ],
  }
}

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string} opts.name - The name.
 * @param {string} opts.outputFile - The output file.
 * @param {string} opts.entryFile - The entry file.
 * @param {boolean} [opts.bundleDeps] - Flag indicating whether to make all deps external.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @returns {import('rollup').RollupOptions}
 */
function legacyConfig(opts) {
  const forceDevEnv = opts.forceDevEnv || false
  const forceBundle = opts.forceBundle || false
  const bundleDeps = opts.bundleDeps || false

  /** @type {import('rollup').OutputOptions[]} */
  const bundleOutput = [
    {
      format: 'esm',
      file: `./build/lib/${opts.outputFile}.legacy.js`,
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: `./build/lib/${opts.outputFile}.legacy.cjs`,
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
      entryFileNames: '[name].legacy.js',
    },
    {
      format: 'cjs',
      dir: `./build/lib`,
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].legacy.cjs',
    },
  ]

  return {
    input: [opts.entryFile],
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      commonJS(),
      babelPlugin('legacy'),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
      forceDevEnv ? forceEnvPlugin('development') : undefined,
      bundleDeps
        ? undefined
        : externals({
            packagePath: './package.json',
            deps: true,
            devDeps: true,
            peerDeps: true,
          }),
      preserveDirectives(),
    ],
  }
}
