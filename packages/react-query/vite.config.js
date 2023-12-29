// @ts-check

import { mergeConfig, defineConfig } from 'vite'
import { getViteConfig } from '../../scripts/getViteConfig.js'

export default mergeConfig(
  getViteConfig({ entry: './src/index.ts' }),
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
