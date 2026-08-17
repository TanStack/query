import { defineConfig } from 'vite'
import { SSR_PORT } from './config/ports.js'

export default defineConfig({
  build: {
    target: 'es2022',
  },
  server: {
    host: '127.0.0.1',
    port: SSR_PORT,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: SSR_PORT,
    strictPort: true,
  },
})
