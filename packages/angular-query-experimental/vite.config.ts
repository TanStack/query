import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'

export default defineConfig({
  plugins: [angular()],
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
