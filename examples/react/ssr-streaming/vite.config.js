import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    /**
     * Without this react won't give us renderToReadableStream even when the node version supports web streams...
     */
    conditions: ['workerd', 'worker', 'browser'],
  },
})
