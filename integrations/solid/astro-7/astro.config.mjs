import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'

export default defineConfig({
  integrations: [solidJs()],
})
