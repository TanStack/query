import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'eslint-plugin-query',
    setupFiles: ['../../jest-preset.js'],
    watch: false,
  },
})
