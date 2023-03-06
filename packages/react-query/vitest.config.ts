import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react-query',
    watch: false,
    environment: 'jsdom',
    setupFiles: [],
  },
})
