import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [preact()],
  build: {
    copyPublicDir: !isSsrBuild,
  },
}))
