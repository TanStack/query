import adapter from '@sveltejs/adapter-auto'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      typescript: {
        config: (tsconfig) => {
          tsconfig.include.push('../eslint.config.js')
        },
      },
      compilerOptions: {
        runes: true,
      },
    }),
  ],
})
