import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'solid-query',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
    deps: {}, // HACK: Magically fixes issues with @solidjs/testing-library
  },
  plugins: [solid()],
})
