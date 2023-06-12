// @ts-check

import { defineConfig } from 'rollup'
import withSolid from 'rollup-preset-solid'

export function createSolidQueryConfig() {
  const solidRollupOptions = /** @type {import('rollup').RollupOptions} */ (
    withSolid({
      input: `./src/index.ts`,
      targets: ['esm', 'cjs'],
      external: ['@tanstack/query-core'],
    })
  )

  const outputs = !solidRollupOptions.output
    ? []
    : Array.isArray(solidRollupOptions.output)
    ? solidRollupOptions.output
    : [solidRollupOptions.output]

  outputs.forEach((output) => {
    if (output.format === 'cjs') {
      output.entryFileNames = '[name].cjs'
      output.chunkFileNames = '[name]-[hash].cjs'
    }
  })

  return solidRollupOptions  
}

export default defineConfig(createSolidQueryConfig())
