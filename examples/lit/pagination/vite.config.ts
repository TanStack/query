import { defineConfig } from 'vite'
import { DEMO_PORT } from './config/ports.js'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: DEMO_PORT,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: DEMO_PORT,
    strictPort: true,
  },
})
