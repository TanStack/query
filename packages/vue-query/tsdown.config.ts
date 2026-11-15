import { defineConfig } from 'tsdown'
import { legacyConfig, modernConfig } from './root.tsdown.config.js'

export default defineConfig([
  modernConfig({ entry: ['src/*.ts', 'src/devtools/*.ts'] }),
  legacyConfig({ entry: ['src/*.ts', 'src/devtools/*.ts'] }),
])
