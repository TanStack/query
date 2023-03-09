import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query-persist-client',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'istanbul' },
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
      '@tanstack/react-query': resolve(__dirname, '..', 'react-query', 'src'),
      '@tanstack/query-persist-client-core': resolve(
        __dirname,
        '..',
        'query-persist-client-core',
        'src',
      ),
    },
  },
})
