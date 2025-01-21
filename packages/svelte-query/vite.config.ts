import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    svelte(),
    svelteTesting(),
    tsconfigPaths({ ignoreConfigErrors: true }),
  ],
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
