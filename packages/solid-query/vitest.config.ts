import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'solid-query',
    dir: './src',
    watch: false,
    setupFiles: [],
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'istanbul' },
  },
  plugins: [solid()],
})
