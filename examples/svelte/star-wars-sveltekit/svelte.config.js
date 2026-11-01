import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    typescript: {
      config: (tsconfig) => {
        tsconfig.include.push('../eslint.config.js', '../svelte.config.js')
      },
    },
  },
  compilerOptions: {
    runes: true,
  },
}

export default config
