import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

import packageJson from './package.json'

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const angularQueryEntry = path.join(packageDir, '../angular-query/src/index.ts')
const angularQueryInternalEntry = path.join(
  packageDir,
  '../angular-query/src/internal.ts',
)

export default defineConfig({
  // fix from https://github.com/vitest-dev/vitest/issues/6992#issuecomment-2509408660
  resolve: {
    conditions: ['@tanstack/custom-condition'],
    alias: {
      '@tanstack/angular-query/internal': angularQueryInternalEntry,
      '@tanstack/angular-query': angularQueryEntry,
    },
  },
  environments: {
    ssr: {
      resolve: {
        conditions: ['@tanstack/custom-condition'],
      },
    },
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: {
      enabled: !!process.env.CI,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    globals: true,
    restoreMocks: true,
  },
})
