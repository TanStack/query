import { defineConfig } from 'tsdown'
import { getTsdownConfig } from './root.tsdown.config.js'

export default defineConfig({
  ...getTsdownConfig({ entry: ['src/index.ts'] }),
  // Preserve React's client boundaries and let the consuming app remove unused plugins.
  unbundle: true,
})
