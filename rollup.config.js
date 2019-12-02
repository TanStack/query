import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import size from 'rollup-plugin-size';
import pkg from './package.json'

export default [
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [external(), babel(), resolve(), commonjs(),
      size({publish:true,exclude:pkg.module,filename:'sizes-cjs.json',writeFile:process.env.CI?true:false}),
      sizeSnapshot()],
  },
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    plugins: [external(), babel(),
      size({publish:true,exclude:pkg.main,filename:'sizes-es.json',writeFile:process.env.CI?true:false}),
      sizeSnapshot()],
  },
]
