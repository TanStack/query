import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'solid', autoCodeSplitting: true }),
    solid(),
  ],
})
