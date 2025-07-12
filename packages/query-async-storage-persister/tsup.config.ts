import { defineConfig } from 'tsup'

// @ts-ignore out of scope
import { legacyConfig, modernConfig } from '../../scripts/getTsupConfig.js'

export default defineConfig([
  modernConfig({ entry: ['src/*.ts'] }),
  legacyConfig({ entry: ['src/*.ts'] }),
])
