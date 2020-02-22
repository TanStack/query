import babel from 'rollup-plugin-babel'
import external from 'rollup-plugin-peer-deps-external'
import { terser } from 'rollup-plugin-terser'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import size from 'rollup-plugin-size'
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      external(),
      babel(),
      size({
        publish: true,
        exclude: pkg.main,
        filename: 'sizes-es.json',
        writeFile: process.env.CI ? true : false,
      }),
      sizeSnapshot(),
    ],
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
    plugins: [
      external(),
      babel(),
      size({
        publish: true,
        exclude: pkg.module,
        filename: 'sizes-cjs.json',
        writeFile: process.env.CI ? true : false,
      }),
      sizeSnapshot(),
    ],
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
        publish: true,
        exclude: pkg.module,
        filename: 'sizes-cjs.json',
        writeFile: process.env.CI ? true : false,
      }),
      sizeSnapshot(),
    ],
  },
]
