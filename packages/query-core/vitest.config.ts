import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-core',
    watch: false,
    environment: 'jsdom',
    globals: true,
  },
})
