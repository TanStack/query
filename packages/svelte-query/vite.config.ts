import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'
import packageJson from './package.json'

export default defineConfig({
  //@ts-ignore
  plugins: [svelte(), svelteTesting()],
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.svelte.ts'],
    setupFiles: ['./tests/test-setup.ts'],
    coverage: { enabled: false, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    alias: {
      // This is needed for svelte-5 support
      // https://github.com/testing-library/svelte-testing-library?tab=readme-ov-file#svelte-5-support
      '@testing-library/svelte': '@testing-library/svelte/svelte5',
    },
  },
})
