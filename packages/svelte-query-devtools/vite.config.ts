import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [svelte()],
  resolve: {
    alias: {
      "@tanstack/query-core": path.resolve(__dirname, '..', 'query-core', 'src'),
      "@tanstack/query-devtools": path.resolve(__dirname, '..', 'query-devtools', 'src'),
      "@tanstack/svelte-query": path.resolve(__dirname, '..', 'svelte-query', 'src'),
    }
  }
};

export default config;
