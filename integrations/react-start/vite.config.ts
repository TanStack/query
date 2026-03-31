import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 3117,
  },
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
})
