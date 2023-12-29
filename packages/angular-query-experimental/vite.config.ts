import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'angular-query-experimental',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
    globals: true,
    include: ['**/*.test.ts'],
    cache: {
      dir: `../../node_modules/.vitest`,
    },
  },
})
