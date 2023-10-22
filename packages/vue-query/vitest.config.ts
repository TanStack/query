import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'vue-query',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { provider: 'istanbul' },
    onConsoleLog: function (log) {
      if (log.includes('Download the Vue Devtools extension')) {
        return false
      }
    },
  },
})
