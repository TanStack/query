import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'

import packageJson from './package.json'

export default defineConfig({
  plugins: [octane()],
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
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    globalSetup: ['./tests/differential/_setup.ts'],
    coverage: {
      enabled: !!process.env.CI,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
    retry: process.env.CI ? 3 : 0,
  },
})
