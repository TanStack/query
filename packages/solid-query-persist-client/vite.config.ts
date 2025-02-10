import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

export default defineConfig({
  plugins: [solid(), tsconfigPaths({ ignoreConfigErrors: true })],
  resolve: {
    alias: dynamicAliases,
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
})
