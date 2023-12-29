import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'

export default defineConfig({
  plugins: [angular()],
  test: {
    name: 'angular-query-devtools-experimental',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: [],
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
