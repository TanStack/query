import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

export default defineConfig({
  plugins: [
    svelte(),
    svelteTesting(),
    tsconfigPaths({ ignoreConfigErrors: true }),
  ],
  resolve: {
    alias: dynamicAliases,
  },
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
