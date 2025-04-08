import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

import packageJson from './package.json'

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ['@tanstack/custom-condition'],
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
