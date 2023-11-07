import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'vue-query-devtools',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul' },
  },
})
