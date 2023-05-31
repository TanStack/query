import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    globals: true,
    coverage: { provider: 'istanbul' },
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
    },
  },
})
