// @ts-check

import node from '@astrojs/node'
import solidJs from '@astrojs/solid-js'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
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
