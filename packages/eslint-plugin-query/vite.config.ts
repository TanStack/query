import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'eslint-plugin-query',
    dir: './src',
    watch: false,
    globals: true,
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
  },
})
