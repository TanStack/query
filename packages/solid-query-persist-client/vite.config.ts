<<<<<<<< HEAD:packages/svelte-query-runes/vite.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte'
========
>>>>>>>> main:packages/solid-query-persist-client/vite.config.ts
import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'

export default defineConfig({
<<<<<<<< HEAD:packages/svelte-query-runes/vite.config.ts
  //@ts-ignore
  plugins: [svelte()],
  test: {
    name: 'svelte-query',
    watch: false,
    coverage: { provider: 'istanbul' },
    environment: 'jsdom',
    include: ['src/**/createQuery.{test,spec}.{js,ts}'],
    setupFiles: ['test-setup.ts'],
========
  plugins: [solid()],
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    restoreMocks: true,
>>>>>>>> main:packages/solid-query-persist-client/vite.config.ts
  },
})
