import babel from '@rollup/plugin-babel'
import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import externals from 'rollup-plugin-node-externals'
import { extensions } from './common'
import alias from '@rollup/plugin-alias'

export default defineConfig({
  input: [
    'src/index.ts',
    'src/core/index.ts',
    'src/reactjs/index.ts',
    'src/reactjs/reactBatchedUpdates.native.ts',
    'src/devtools/index.ts',
    'src/devtools/noop.ts',
    'src/persistQueryClient/index.ts',
    'src/createWebStoragePersister/index.ts',
    'src/createAsyncStoragePersister/index.ts',
    'src/broadcastQueryClient-experimental/index.ts',
  ],
  output: [
    {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      preserveModules: true,
    },
    {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
      preserveModules: true,
    },
  ],
  plugins: [
    alias({
      entries: [{ find: 'react-query', replacement: './src/index.ts' }],
    }),
    externals({
      deps: true,
      devDeps: true,
      peerDeps: true,
    }),
    resolve({ extensions }),
    babel({ extensions, babelHelpers: 'runtime' }),
  ],
})
