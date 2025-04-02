import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

import { dynamicAliases } from './root.vite.config'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: dynamicAliases,
    conditions: ['tanstack-internal'],
  },
})
