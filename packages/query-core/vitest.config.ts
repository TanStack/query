import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-core',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: { provider: 'istanbul' },
  },
})
