import { resolve } from 'path'
import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'solid-query',
    watch: false,
    setupFiles: [],
    environment: 'jsdom',
    globals: true,
    dir: 'src/__tests__',
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
    },
  },
  plugins: [solid()],
})
