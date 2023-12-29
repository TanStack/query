import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  test: {
    name: 'solid-query-devtools',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
  },
})
