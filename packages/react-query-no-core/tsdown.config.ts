import { defineConfig } from 'tsdown'
import { getTsdownConfig } from './root.tsdown.config.js'

export default defineConfig({
  ...getTsdownConfig({ entry: ['src/index.ts'] }),
  // Keep React client directives on the hooks and providers that own them.
  unbundle: true,
})
