import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'eslint-plugin-query',
    dir: './src',
    watch: false,
    coverage: { provider: 'istanbul' },
  },
})
