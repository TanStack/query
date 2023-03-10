import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-sync-storage-persister',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
  },
  resolve: {
    alias: {
      '@tanstack/query-core': resolve(__dirname, '..', 'query-core', 'src'),
      '@tanstack/query-persist-client-core': resolve(
        __dirname,
        '..',
        'query-persist-client-core',
        'src',
      ),
    },
  },
})
