import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [preact()],
  build: {
    copyPublicDir: !isSsrBuild,
  },
}))
