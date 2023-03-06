import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query-devtools',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
})
