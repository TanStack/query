import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { dynamicAliases } from './root.vite.config'
import packageJson from './package.json'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: dynamicAliases,
    conditions: ['tanstack-internal'],
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
