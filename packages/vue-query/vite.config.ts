import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

import packageJson from './package.json'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    conditions: ['@tanstack/custom-condition'],
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    onConsoleLog: function (log) {
      if (log.includes('Download the Vue Devtools extension')) {
        return false
      }
      return undefined
    },
  },
})
