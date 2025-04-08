import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { dynamicAliases } from './root.vite.config'

export default defineConfig({
  plugins: [svelte(), tsconfigPaths({ ignoreConfigErrors: true })],
  resolve: {
    alias: dynamicAliases,
  },
})
