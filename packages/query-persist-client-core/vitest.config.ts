import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-persist-client-core',
    watch: false,
    globals: true,
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
    },
  },
})
