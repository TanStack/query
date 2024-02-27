import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  //@ts-ignore
  plugins: [svelte()],
  test: {
    name: 'svelte-query',
    watch: false,
    coverage: { provider: 'istanbul' },
    environment: 'jsdom',
    include: ['src/**/createQuery.{test,spec}.{js,ts}'],
    setupFiles: ['test-setup.ts'],
  },
})
