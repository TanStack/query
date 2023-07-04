import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [svelte()],
  test: {
    name: 'svelte-query',
    watch: false,
    globals: true,
    coverage: { provider: 'istanbul' },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['vitest.setup.ts'],
  },
})
