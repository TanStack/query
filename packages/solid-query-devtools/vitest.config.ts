import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'solid-query-devtools',
    dir: './src',
    watch: false,
    setupFiles: [],
    environment: 'jsdom',
    coverage: { provider: 'istanbul' },
  },
  plugins: [solid()],
})
