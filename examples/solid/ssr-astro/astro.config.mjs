// @ts-check
import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'
// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [solidJs()],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [tailwindcss()],
  },
})
