import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'

const external = ['react']

const globals = {
  react: 'React',
}

export default [
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
    plugins: [babel()],
  },
  {
    input: 'src/index.js',
    output: [
      {
        name: 'ReactQuery',
        file: 'dist/react-query.production.min.js',
        format: 'umd',
        sourcemap: true,
        globals,
      },
      {
        file: 'dist/react-query.min.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    external,
    plugins: [babel(), terser(), size()],
  },
]
