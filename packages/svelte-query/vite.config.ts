import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@tanstack/query-core": resolve(__dirname, '..', 'query-core', 'src'),
    }
  },
  test: {
    name: 'svelte-query',
    watch: false,
    coverage: { provider: 'istanbul' },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['vitest.setup.ts']
  }
});
