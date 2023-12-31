import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'angular-query-devtools-experimental',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
  },
})
