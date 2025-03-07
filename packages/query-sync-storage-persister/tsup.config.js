// @ts-check

import { defineConfig } from 'tsup'
import { legacyConfig, modernConfig } from './root.tsup.config.js'

export default defineConfig([
  modernConfig({ entry: ['src/*.ts'] }),
  legacyConfig({ entry: ['src/*.ts'] }),
])
