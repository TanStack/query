import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    globals: true,
    coverage: { provider: 'istanbul' },
  },
})
