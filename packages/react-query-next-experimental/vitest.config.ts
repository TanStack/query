import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query-next-experimental',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul' },
  },
})
