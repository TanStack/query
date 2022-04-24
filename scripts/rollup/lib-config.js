import babel from '@rollup/plugin-babel'
import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import externals from 'rollup-plugin-node-externals'
import { extensions } from './common'

export default defineConfig({
  input: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'reactjs/index': 'src/reactjs/index.ts',
    'reactjs/reactBatchedUpdates': 'src/reactjs/reactBatchedUpdates.ts',
    'reactjs/reactBatchedUpdates.native':
      'src/reactjs/reactBatchedUpdates.native.ts',
    'devtools/index': 'src/devtools/index.ts',
    'devtools/noop': 'src/devtools/noop.ts',
    'persistQueryClient/index': 'src/persistQueryClient/index.ts',
    'createWebStoragePersister/index': 'src/createWebStoragePersister/index.ts',
    'createAsyncStoragePersister/index':
      'src/createAsyncStoragePersister/index.ts',
    'broadcastQueryClient--experimental/index':
      'src/broadcastQueryClient-experimental/index.ts',
  },
  output: [
    {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
    },
    {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
    },
  ],
  plugins: [
    externals({
      deps: true,
      devDeps: true,
      peerDeps: true,
    }),
    resolve({
      extensions,
      resolveOnly(module) {
        return module !== 'react-query'
      },
    }),
    babel({ extensions, babelHelpers: 'runtime' }),
  ],
})
