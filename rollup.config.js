import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import externalDeps from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import commonJS from 'rollup-plugin-commonjs'
import visualizer from 'rollup-plugin-visualizer'
import replace from '@rollup/plugin-replace'

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
  ['src/hydration/index.ts', 'ReactQueryHydration', 'react-query-hydration'],
  [
    'src/persistQueryClient-experimental/index.ts',
    'ReactQueryPersistQueryClientExperimental',
    'persistQueryClient-experimental',
  ],
  [
    'src/createWebStoragePersistor-experimental/index.ts',
    'ReactQueryCreateWebStoragePersistorExperimental',
    'createWebStoragePersistor-experimental',
  ],
  [
    'src/createAsyncStoragePersistor-experimental/index.ts',
    'ReactQueryCreateAsyncStoragePersistorExperimental',
    'createAsyncStoragePersistor-experimental',
  ],
  [
    'src/broadcastQueryClient-experimental/index.ts',
    'ReactQueryBroadcastQueryClientExperimental',
    'broadcastQueryClient-experimental',
  ],
]

const extensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
const babelConfig = { extensions, runtimeHelpers: true }
const resolveConfig = { extensions }

export default inputSrcs
  .map(([input, name, file]) => {
    return [
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
          resolve(resolveConfig),
          babel(babelConfig),
          commonJS(),
          externalDeps(),
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
          }),
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
    ]
  })
  .flat()
