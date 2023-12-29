import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteBuildConfig } from '../../scripts/getViteConfig.js'

export default mergeConfig(
  viteBuildConfig({
    entry: './src/index.ts',
    srcDir: './src',
    exclude: ['./src/__tests__'],
  }),
  defineConfig({
    plugins: [react()],
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
