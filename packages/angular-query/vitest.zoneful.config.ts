import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

/**
 * Runs the Angular tests with Zone.js enabled. Tests use the change-detection
 * provider from test-utils, which selects provideZoneChangeDetection here and
 * provideZonelessChangeDetection in the default runner.
 */
const config = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: ['./test-setup.zoneful.ts'],
    },
  }),
)

// The base project excludes the Zone.js-only integration file so an ordinary
// run remains genuinely zoneless. The Zone.js project explicitly opts it in.
if (config.test) {
  // Replace, rather than merge with, the base setup so Zone.js is installed
  // before Angular initializes its browser testing environment.
  config.test.setupFiles = ['./test-setup.zoneful.ts']
  config.test.include = [
    '**/zoneful-integration.test.ts',
    '**/pending-tasks.test.ts',
    '**/pending-tasks-ssr.zoneful.test.ts',
    '**/upstream-issues.test.ts',
    '**/inject-external-store.test.ts',
  ]
  config.test.exclude = []
}

export default config
