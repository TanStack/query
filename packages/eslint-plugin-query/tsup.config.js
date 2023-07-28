// @ts-check

import { defineConfig } from 'tsup'
import { legacyConfig } from '../../scripts/getTsupConfig.js'

export default defineConfig([legacyConfig({ entry: ['src/**/*.ts'] })])
