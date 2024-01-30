import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'angular-query-experimental',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    globals: true,
  },
})
