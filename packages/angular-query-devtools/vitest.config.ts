import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'angular-query-devtools',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: [],
    coverage: { provider: 'istanbul' },
  },
})
