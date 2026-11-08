import marko from '@marko/vite'
import { defineConfig } from 'vitest/config'

import packageJson from './package.json'

export default defineConfig({
  plugins: [marko()],
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
  test: {
    name: packageJson.name,
    watch: false,
    coverage: {
      enabled: !!process.env.CI,
      provider: 'istanbul',
      include: ['src/**/*'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          include: ['tests/core/**/*.test.ts'],
          environment: 'node',
          typecheck: { include: ['tests/core/**/*.test-d.ts'] },
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/**/*.browser.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          include: ['tests/**/*.server.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
