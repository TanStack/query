import marko from '@marko/vite'
import { defineConfig } from 'vite'

// `linked: false` because this app has an `index.html` entry and no server
// render. Linked mode is for apps that render Marko on the server.
export default defineConfig({
  plugins: [marko({ linked: false })],
})
