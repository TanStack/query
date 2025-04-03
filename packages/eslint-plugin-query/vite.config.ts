import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/config/vite'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

const config = defineConfig({
  resolve: {
    alias: dynamicAliases,
    conditions: ['@tanstack/custom-condition'],
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    globals: true,
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
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
