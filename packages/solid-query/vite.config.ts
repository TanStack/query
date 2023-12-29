import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  test: {
    name: 'solid-query',
    dir: './src',
    watch: false,
    setupFiles: ['test-setup.ts'],
    environment: 'jsdom',
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
    server: {
      deps: {
        // https://github.com/solidjs/solid-testing-library#known-issues
        inline: [/solid-js/],
      },
    },
  },
})
