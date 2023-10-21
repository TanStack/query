import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'codemods',
    dir: './src',
    watch: false,
    coverage: { provider: 'istanbul' },
  },
})
