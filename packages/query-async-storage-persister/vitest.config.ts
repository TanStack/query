import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-async-storage-persister',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
  },
})
