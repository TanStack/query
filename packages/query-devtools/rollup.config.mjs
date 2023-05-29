// @ts-check

import { defineConfig } from 'rollup'
import { createTanstackQueryDevtoolsConfig } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(createTanstackQueryDevtoolsConfig())
