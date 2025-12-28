import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateReferenceDocs } from '@tanstack/typedoc-config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

await generateReferenceDocs({
  packages: [
    {
      name: 'angular-query-experimental',
      entryPoints: [
        resolve(
          __dirname,
          '../packages/angular-query-experimental/src/index.ts',
        ),
      ],
      tsconfig: resolve(
        __dirname,
        '../packages/angular-query-experimental/tsconfig.json',
      ),
      outputDir: resolve(__dirname, '../docs/framework/angular/reference'),
      exclude: ['./packages/query-core/**/*'],
    },
    {
      name: 'svelte-query',
      entryPoints: [
        resolve(__dirname, '../packages/svelte-query/src/index.ts'),
      ],
      tsconfig: resolve(__dirname, '../packages/svelte-query/tsconfig.json'),
      outputDir: resolve(__dirname, '../docs/framework/svelte/reference'),
      exclude: ['./packages/query-core/**/*'],
    },
  ],
})

console.log('\n✅ All markdown files have been processed!')

process.exit(0)
