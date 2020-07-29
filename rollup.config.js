import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import externalDeps from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import commonJS from 'rollup-plugin-commonjs'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'

const external = ['react']

const globals = {
  react: 'React',
}

const inputSrc = 'src/index.ts'

const extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
const babelConfig = { extensions }
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
      visualizer(),
    ],
  },
]
