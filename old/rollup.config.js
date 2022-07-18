import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import externals from 'rollup-plugin-node-externals'
import resolve from '@rollup/plugin-node-resolve'
import commonJS from '@rollup/plugin-commonjs'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'rollup'

const external = ['react', 'react-dom', 'react-query']

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-query': 'ReactQuery',
}

const inputSrcs = [
  ['src/index.ts', 'ReactQuery', 'react-query'],
  ['src/core/index.ts', 'ReactQueryCore', 'react-query-core'],
  ['src/devtools/index.ts', 'ReactQueryDevtools', 'react-query-devtools'],
  [
    'src/persistQueryClient/index.ts',
    'ReactQueryPersistQueryClient',
    'persistQueryClient',
  ],
  [
    'src/createWebStoragePersister/index.ts',
    'ReactQueryCreateWebStoragePersister',
    'createWebStoragePersister',
  ],
  [
    'src/createAsyncStoragePersister/index.ts',
    'ReactQueryCreateAsyncStoragePersister',
    'createAsyncStoragePersister',
  ],
  [
    'src/broadcastQueryClient-experimental/index.ts',
    'ReactQueryBroadcastQueryClientExperimental',
    'broadcastQueryClient-experimental',
  ],
]

const extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']

const babelConfig = {
  extensions,
  babelHelpers: 'bundled',
}
const resolveConfig = { extensions }

const externalPeerDeps = () =>
  externals({ deps: false, devDeps: false, peerDeps: true })

export default inputSrcs
  .map(([input, name, file]) => {
    return defineConfig([
      {
        input: input,
        output: {
          name,
          file: `dist/${file}.development.js`,
          format: 'umd',
          sourcemap: true,
          globals,
        },
        external,
        plugins: [
          externalPeerDeps(),
          resolve(resolveConfig),
          babel(babelConfig),
          commonJS(),
        ],
      },
      {
        input: input,
        output: {
          name,
          file: `dist/${file}.production.min.js`,
          format: 'umd',
          sourcemap: true,
          globals,
        },
        external,
        plugins: [
          replace({
            'process.env.NODE_ENV': `"production"`,
            delimiters: ['', ''],
            preventAssignment: true,
          }),
          externalPeerDeps(),
          resolve(resolveConfig),
          babel(babelConfig),
          commonJS(),
          terser(),
          size(),
          visualizer({
            filename: 'stats-react.json',
            json: true,
          }),
        ],
      },
    ])
  })
  .flat()
