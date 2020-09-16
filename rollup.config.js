import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import externalDeps from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import commonJS from 'rollup-plugin-commonjs'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'

const external = ['react', 'react-dom']
const hydrationExternal = [...external, 'react-query']

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
}
const hydrationGlobals = {
  ...globals,
  'react-query': 'ReactQuery',
}

const inputSrc = 'src/index.ts'
const hydrationSrc = 'src/hydration/index.ts'

const extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
const babelConfig = { extensions, runtimeHelpers: true }
const resolveConfig = { extensions }

export default [
  {
    input: inputSrc,
    output: {
      file: 'dist/react-query.mjs',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
    ],
  },
  {
    input: inputSrc,
    output: {
      file: 'dist/react-query.min.mjs',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
      terser(),
    ],
  },
  {
    input: inputSrc,
    output: {
      name: 'ReactQuery',
      file: 'dist/react-query.development.js',
      format: 'umd',
      sourcemap: true,
      globals,
    },
    external,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
    ],
  },
  {
    input: inputSrc,
    output: {
      name: 'ReactQuery',
      file: 'dist/react-query.production.min.js',
      format: 'umd',
      sourcemap: true,
      globals,
    },
    external,
    plugins: [
      replace({ 'process.env.NODE_ENV': `"production"`, delimiters: ['', ''] }),
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
      terser(),
      size(),
      visualizer({
        filename: 'stats-react.json',
        json: true,
      }),
    ],
  },
  {
    input: hydrationSrc,
    output: {
      file: 'dist/hydration/react-query-hydration.mjs',
      format: 'es',
      sourcemap: true,
    },
    external: hydrationExternal,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
    ],
  },
  {
    input: hydrationSrc,
    output: {
      file: 'dist/hydration/react-query-hydration.min.mjs',
      format: 'es',
      sourcemap: true,
    },
    external: hydrationExternal,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
      terser(),
    ],
  },
  {
    input: hydrationSrc,
    output: {
      name: 'ReactQueryHydration',
      file: 'dist/hydration/react-query-hydration.development.js',
      format: 'umd',
      sourcemap: true,
      globals: hydrationGlobals,
    },
    external: hydrationExternal,
    plugins: [
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
    ],
  },
  {
    input: hydrationSrc,
    output: {
      name: 'ReactQueryHydration',
      file: 'dist/hydration/react-query-hydration.production.min.js',
      format: 'umd',
      sourcemap: true,
      globals: hydrationGlobals,
    },
    external: hydrationExternal,
    plugins: [
      replace({ 'process.env.NODE_ENV': `"production"`, delimiters: ['', ''] }),
      resolve(resolveConfig),
      babel(babelConfig),
      commonJS(),
      externalDeps(),
      terser(),
      size(),
      visualizer({
        filename: 'stats-hydration.json',
        json: true,
      }),
    ],
  },
]
