import { angular } from '@nitedani/vite-plugin-angular/plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },

  plugins: [angular()],
})
