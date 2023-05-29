// @ts-check

import { defineConfig } from 'rollup'
import { createSolidQueryConfig } from '../../scripts/getRollupConfig.mjs'

export default defineConfig(createSolidQueryConfig())
