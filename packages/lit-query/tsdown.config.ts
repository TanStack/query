import { defineConfig } from 'tsdown'
import { legacyConfig, modernConfig } from './root.tsdown.config.js'

export default defineConfig([
  modernConfig({ entry: ['src/index.ts'] }),
  legacyConfig({ entry: ['src/index.ts'] }),
])
