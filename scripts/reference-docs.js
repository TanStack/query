import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, rm } from 'node:fs/promises'
import * as TypeDoc from 'typedoc'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * @type {Partial<import("typedoc").TypeDocOptions & import("typedoc-plugin-markdown").PluginOptions>}
 */
const options = {
  plugin: [
    'typedoc-plugin-markdown',
    'typedoc-plugin-frontmatter',
    resolve(__dirname, './typedoc-remove-prefix.js'),
  ],
  hideGenerator: true,
  readme: 'none',
  flattenOutputFiles: true,
  entryFileName: 'index',
  hideBreadcrumbs: true,
  hidePageHeader: true,
  useCodeBlocks: true,
  excludePrivate: true,
}

/** @type {Array<{name: string, entryPoints: Array<string>, tsconfig: string, outputDir: string, exclude?: Array<string>}>} */
const packages = [
  {
    name: 'angular-query-experimental',
    entryPoints: [
      resolve(__dirname, '../packages/angular-query-experimental/src/index.ts'),
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
    entryPoints: [resolve(__dirname, '../packages/svelte-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/svelte-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/svelte/reference'),
    exclude: ['./packages/query-core/**/*'],
  },
]

async function main() {
  for (const pkg of packages) {
    // Clean and recreate the output directories
    try {
      await rm(pkg.outputDir, { recursive: true })
    } catch (error) {
      // @ts-expect-error
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
    await mkdir(pkg.outputDir, { recursive: true })

    const app = await TypeDoc.Application.bootstrapWithPlugins({
      ...options,
      entryPoints: pkg.entryPoints,
      tsconfig: pkg.tsconfig,
      exclude: pkg.exclude,
    })

    const project = await app.convert()

    if (project) {
      await app.generateDocs(project, pkg.outputDir)
    }
  }
}

main().catch(console.error)
