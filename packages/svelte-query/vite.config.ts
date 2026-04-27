import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'

import packageJson from './package.json'

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  // fix from https://github.com/vitest-dev/vitest/issues/6992#issuecomment-2509408660
  resolve: {
    conditions: ['@tanstack/custom-condition'],
  },
  environments: {
    ssr: {
      resolve: {
        conditions: ['@tanstack/custom-condition'],
      },
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress false positive "unused import" warnings from @tanstack/query-core
        // These imports (notifyManager, replaceEqualDeep) are actually used in the code
        if (
          warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
          warning.message?.includes('@tanstack/query-core')
        ) {
          return
        }
        warn(warning)
      },
    },
  },
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
  },
})
