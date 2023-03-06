import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'vue-query',
    watch: false,
    environment: 'jsdom',
    globals: true,
    dir: 'src/__tests__',
    setupFiles: ['test-setup.ts'],
  },
})
