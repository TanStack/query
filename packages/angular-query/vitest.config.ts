import { defineConfig } from 'vitest/config'

// globals: true,
//   environment: 'jsdom',
//   setupFiles: ['src/test-setup.ts'],
//   include: ['**/*.spec.ts'],
//   cache: {
//   dir: `../../node_modules/.vitest`,
// },

export default defineConfig({
  test: {
    name: 'angular-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      exclude: ['src/tests/**'],
    },
    globals: true,
    include: ['**/*.test.ts'],
    cache: {
      dir: `../../node_modules/.vitest`,
    },
  },
})
