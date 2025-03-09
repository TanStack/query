import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateReferenceDocs } from '@tanstack/config/typedoc'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('@tanstack/config/typedoc').Package[]} */
const packages = [
  {
    name: 'angular-query',
    entryPoints: [
      resolve(__dirname, '../packages/angular-query/src/index.ts'),
    ],
    tsconfig: resolve(
      __dirname,
      '../packages/angular-query/tsconfig.json',
    ),
    outputDir: resolve(__dirname, '../docs/framework/angular/reference'),
    exclude: ['./packages/query-core/**/*'],
  },
  {
    name: 'svelte-query',
    entryPoints: [resolve(__dirname, '../packages/svelte-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/svelte-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/svelte/reference'),
    exclude: ['./packages/query-core/**/*'],
  },
]

await generateReferenceDocs({ packages })

process.exit(0)
