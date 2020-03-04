import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import postcss from 'rollup-plugin-postcss'

const external = ['react']

const globals = {
  react: 'React',
}

export default [
  // {
  //   input: 'src/index.js',
  //   output: {
  //     file: 'dist/react-query.es.js',
  //     format: 'esm',
  //     sourcemap: true,
  //   },
  //   external,
  //   plugins: [babel(), postcss()],
  // },
  {
    input: 'src/index.js',
    output: {
      name: 'ReactQuery',
      file: 'dist/react-query.development.js',
      format: 'umd',
      sourcemap: true,
      globals,
    },
    external,
    plugins: [babel(), postcss()],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'ReactQuery',
      file: 'dist/react-query.production.min.js',
      format: 'umd',
      sourcemap: true,
      globals,
    },
    external,
    plugins: [
      babel(),
      terser(),
      size({
        writeFile: false,
      }),
    ],
  },
]
