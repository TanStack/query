import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json'

export default defineConfig({
  plugins: [svelte()],
  test: {
    name: packageJson.name,
    watch: false,
    coverage: { provider: 'istanbul' },
    environment: 'jsdom',
    include: ['src/**/createQuery.{test,spec}.{js,ts}'],
    setupFiles: ['test-setup.ts'],
  },
})
