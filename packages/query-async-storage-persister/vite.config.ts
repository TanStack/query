import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-async-storage-persister',
    dir: './src',
    watch: false,
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
