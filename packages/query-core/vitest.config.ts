import { defineConfig } from 'vitest/config'
// import react from '@vitesjs/plugin-react'

export default defineConfig({
  test: {
    name: 'query-core',
    setupFiles: ['./test-setup.ts'],
    watch: false,
    environment: 'jsdom',
  },
  // plugins: [react()],
})
