import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

// Progressive Web App
// https://vite-pwa-org.netlify.app/guide/
// based on workbox
// https://web.dev/learn/pwa/workbox/
//import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    solidPlugin(),
    //VitePWA({ registerType: 'autoUpdate' }),
  ],
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
