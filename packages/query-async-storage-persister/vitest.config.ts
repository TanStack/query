import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-async-storage-persister',
    dir: './src',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
  },
})
