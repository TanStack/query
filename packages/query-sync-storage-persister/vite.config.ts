import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-sync-storage-persister',
    dir: './src',
    watch: false,
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
  },
})
