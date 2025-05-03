import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: dynamicAliases,
  },
  test: {
    name: packageJson.name,
    globals: true,

    workspace: [
      {
        extends: './vite.config.ts',
        plugins: [svelteTesting()],

        test: {
          name: 'client',
          environment: 'jsdom',
          clearMocks: true,
          include: ['tests/**/*.svelte.{test,spec}.{js,ts}'],
          setupFiles: ['./tests/vitest-setup-client.ts'],
        },
      },
      {
        extends: './vite.config.ts',

        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/**/*.{test,spec}.{js,ts}'],
          exclude: ['tests/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
})
