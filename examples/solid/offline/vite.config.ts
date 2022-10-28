import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    // NOTE(milahu): this would break deps
    // vite error: Could not resolve "@mswjs/cookies"
    //preserveSymlinks: true,
  },
})
