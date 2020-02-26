import babel from 'rollup-plugin-babel'
import external from 'rollup-plugin-peer-deps-external'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [external(), babel()],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'ReactQuery',
      file: pkg.main,
      format: 'umd',
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
    plugins: [external(), babel()],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'ReactQuery',
      file: pkg.unpkg,
      format: 'umd',
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
    plugins: [
      external(),
      babel(),
      terser(),
      size({
        writeFile: false,
      }),
    ],
  },
]
