import marko from '@marko/run/vite'
import { defineConfig } from 'vite'
import { DEMO_PORT } from './config/port.js'

export default defineConfig({
  plugins: [marko()],
  server: { host: '127.0.0.1', port: DEMO_PORT, strictPort: true },
  preview: { host: '127.0.0.1', port: DEMO_PORT, strictPort: true },
})
