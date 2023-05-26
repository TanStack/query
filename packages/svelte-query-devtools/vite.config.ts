import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@tanstack/query-core": resolve(__dirname, '..', 'query-core', 'src'),
      "@tanstack/query-devtools": resolve(__dirname, '..', 'query-devtools', 'src'),
      "@tanstack/svelte-query": resolve(__dirname, '..', 'svelte-query', 'src'),
    }
  }
});
