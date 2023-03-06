import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  test: {
    name: 'solid-query',
    watch: false,
    setupFiles: [],
    environment: 'jsdom',
    globals: true,
    dir: 'src/__tests__',
  },
  plugins: [solid() as any],
})
