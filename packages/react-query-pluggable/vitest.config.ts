import { defineConfig } from 'vitest/config'

// Run the workspace core from source even when its published ESM has not been built.
const resolve = { conditions: ['@tanstack/custom-condition'] }

export default defineConfig({
  resolve,
  environments: { ssr: { resolve } },
})
