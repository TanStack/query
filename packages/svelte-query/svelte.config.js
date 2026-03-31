import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
}

export default config
