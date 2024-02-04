import { defineConfig } from 'vite'
import { angular } from '@nitedani/vite-plugin-angular/plugin'
import { mockAPI } from './src/api/projects'
import type { Plugin } from 'vite'

function mockBackendPlugin(): Plugin {
  return {
    name: 'mock-backend',
    configureServer(server) {
      server.middlewares.use(mockAPI)
    },
  }
}

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },

  plugins: [angular(), mockBackendPlugin()],
})
