import { defineConfig } from 'tsdown'
import { legacyConfig, modernConfig } from './root.tsdown.config.js'

export default defineConfig([
  modernConfig({ entry: ['src/*.ts'] }),
  legacyConfig({ entry: ['src/*.ts'] }),
])
