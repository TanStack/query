// @ts-check

import { defineConfig } from 'tsup'
import { legacyConfig, modernConfig } from '../../scripts/getTsupConfig.js'

export default defineConfig([
  modernConfig({ entry: ['src/*.ts'] }),
  legacyConfig({ entry: ['src/*.ts'] }),
])
