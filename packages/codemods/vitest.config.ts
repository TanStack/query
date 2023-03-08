import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'codemods',
    watch: false,
    globals: true,
  },
})
