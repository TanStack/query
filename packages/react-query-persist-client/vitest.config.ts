import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query-persist-client',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
