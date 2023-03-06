import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-sync-storage-persister',
    watch: false,
    globals: true,
  },
})
