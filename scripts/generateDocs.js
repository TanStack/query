import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateReferenceDocs } from '@tanstack/config/typedoc'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('@tanstack/config/typedoc').Package[]} */
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

await generateReferenceDocs({ packages })

import fg from 'fast-glob'
import { readFileSync, writeFileSync } from 'node:fs'

// Define the pattern to match all generated markdown files
const markdownFilesPattern = 'docs/framework/{angular,svelte}/reference/**/*.md'

// Find all markdown files matching the pattern
const markdownFiles = await fg(markdownFilesPattern)

console.log(`Found ${markdownFiles.length} markdown files to process\n`)

// Process each markdown file
markdownFiles.forEach(file => {
  const content = readFileSync(file, 'utf-8')
  let updatedContent = content
  updatedContent = updatedContent.replaceAll(/\]\(\.\.\//gm, '](../../')
  // updatedContent = content.replaceAll(/\]\(\.\//gm, '](../')
  updatedContent = updatedContent.replaceAll(
    /\]\((?!https?:\/\/|\/\/|\/|\.\/|\.\.\/|#)([^)]+)\)/gm,
    (match, p1) => `](../${p1})`
  )

  // Write the updated content back to the file
  if (updatedContent !== content) {
    writeFileSync(file, updatedContent, 'utf-8')
    console.log(`Processed file: ${file}`)
  }
})

console.log('\n✅ All markdown files have been processed!')


process.exit(0)
