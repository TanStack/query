import { defineConfig } from 'vitest/config'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

export default defineConfig({
  resolve: {
    alias: dynamicAliases,
    conditions: ['tanstack-internal'],
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
