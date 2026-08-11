import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'

import packageJson from './package.json'

const config = defineConfig({
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
    dir: './src',
    watch: false,
    globals: true,
    // The first test run by a type-checked RuleTester (project: true) builds
    // the full TS program for the ts-fixture, which can exceed vitest's 5s
    // default under CI load when other Nx tasks share the runner.
    testTimeout: 15_000,
    coverage: {
      enabled: !!process.env.CI,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
    exclude: ['./src/__tests__'],
  }),
)
