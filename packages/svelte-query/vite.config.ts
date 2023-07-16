import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@tanstack/query-core': path.resolve(
        __dirname,
        '..',
        'query-core',
        'src',
      ),
    },
  },
  test: {
    coverage: {
      provider: 'istanbul',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['vitest.setup.ts'],
  },
})
