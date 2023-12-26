import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte()],
  test: {
    name: 'svelte-query-persist-client',
    watch: false,
    coverage: { provider: 'istanbul', include: ['src/**/*'] },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['test-setup.ts'],
  },
})
