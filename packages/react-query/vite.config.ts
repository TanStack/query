import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import packageJson from './package.json'

export default defineConfig({
  plugins: [react()],
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
    retry: process.env.CI ? 3 : 0,
  },
})
