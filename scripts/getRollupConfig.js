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
 * @param {string} opts.outputFile - The output file.
 * @param {string} opts.entryFile - The entry file.
 * @param {boolean} [opts.bundleDeps] - Flag indicating whether to make all deps external.
 * @param {boolean} [opts.forceDevEnv] - Flag indicating whether to force development environment.
 * @param {boolean} [opts.forceBundle] - Flag indicating whether to force bundling.
 * @returns {import('rollup').RollupOptions}
 */
export function buildConfigs(opts) {
  const input = [opts.entryFile]
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
    input,
    output: forceBundle ? bundleOutput : normalOutput,
    plugins: [
      commonJS(),
      babelPlugin(),
      nodeResolve({ extensions: ['.ts', '.tsx', '.native.ts'] }),
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
