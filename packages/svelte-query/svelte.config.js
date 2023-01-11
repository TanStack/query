import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  package: {
    source: "./src",
    dir: "./build/lib",
    files: (filepath) => {
      return !filepath.includes("__tests__");
    },
  },
};

export default config;
