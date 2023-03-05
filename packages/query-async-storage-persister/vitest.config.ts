import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'query-async-storage-persister',
    setupFiles: ['../../jest-preset.js'],
    watch: false,
  },
})
