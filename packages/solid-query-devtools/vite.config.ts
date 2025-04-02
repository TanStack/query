import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { dynamicAliases } from './root.vite.config'

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: dynamicAliases,
    conditions: ['tanstack-internal'],
  },
})
