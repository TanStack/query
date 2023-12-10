import { defineConfig } from 'vite'
import React from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [React()],
  resolve: {
    dedupe: ['react', 'react-dom', 'use-sync-external-store'],
  },
  build: {
    minify: false,
  },
})
