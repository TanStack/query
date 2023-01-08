import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  package: {
    source: "./src/lib",
    dir: "./build/lib"
  }
};

export default config;
