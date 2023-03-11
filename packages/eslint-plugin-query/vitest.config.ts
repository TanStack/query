import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'eslint-plugin-query',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
  },
})
