import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [svelte()],
  resolve: {
    alias: {
      "@tanstack/query-core": path.resolve(__dirname, '..', 'query-core', 'src'),
    }
  },
  test: {
    coverage: {
      provider: 'istanbul'
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['vitest.setup.ts']
  }
};

export default config;
