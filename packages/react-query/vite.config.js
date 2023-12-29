// @ts-check

import { defineConfig, mergeConfig } from 'vite'
import { getViteConfig } from '../../scripts/getViteConfig.js'

export default mergeConfig(
  getViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
    exclude: ['./src/__tests__'],
  }),
  defineConfig({
    test: {
      name: 'react-query',
      dir: './src',
      watch: false,
      environment: 'jsdom',
      setupFiles: ['test-setup.ts'],
      coverage: { provider: 'istanbul', include: ['src/**/*'] },
    },
  }),
)
