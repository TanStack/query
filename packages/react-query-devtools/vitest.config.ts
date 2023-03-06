import { defineConfig } from 'vitest/config'
import { join, resolve } from 'path'

export default defineConfig({
  test: {
    name: 'react-query-devtools',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
      '@tanstack/react-query': resolve(__dirname, '..', 'react-query', 'src'),
    },
  },
})
