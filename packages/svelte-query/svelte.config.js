import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  },
  package: {
    source: "./src/lib",
    dir: "./build/lib"
  },
  compilerOptions : {
    //Allow vitest to access svelte component properties.
    accessors : true
  }
};

export default config;
