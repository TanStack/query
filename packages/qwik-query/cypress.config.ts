import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "cypress-ct-qwik" as any,
      bundler: "vite",
    },
  },
});
