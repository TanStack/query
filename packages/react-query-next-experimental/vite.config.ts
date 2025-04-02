import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { dynamicAliases } from './root.vite.config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: dynamicAliases,
    conditions: ['tanstack-internal'],
  },
})
