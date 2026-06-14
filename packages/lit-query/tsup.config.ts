import { defineConfig } from 'tsup'
import { legacyConfig, modernConfig } from './root.tsup.config.js'

export default defineConfig([
  modernConfig({ entry: ['src/index.ts'] }),
  legacyConfig({ entry: ['src/index.ts'] }),
])
