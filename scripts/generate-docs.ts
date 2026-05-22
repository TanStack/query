import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const typedocConfigPackageJson =
  require.resolve('@tanstack/typedoc-config/package.json')
const typedocConfigDir = dirname(typedocConfigPackageJson)
const typedocConfigRequire = createRequire(typedocConfigPackageJson)
const TypeDoc = await import(typedocConfigRequire.resolve('typedoc'))

type PackageReferenceDocsConfig = {
  entryPoints: Array<string>
  tsconfig: string
  outputDir: string
  exclude?: Array<string>
  excludeExternals?: boolean
  simplifyLitQueriesControllerTypes?: boolean
  trimGeneratedMarkdown?: boolean
}

type TypeDocReflectionWithSignatures = {
  name: string
  children?: Array<TypeDocReflectionWithSignatures>
  signatures?: Array<{
    typeParameters?: Array<{
      name: string
      default?: unknown
    }>
  }>
}

function simplifyLitQueriesControllerTypes(
  project: TypeDocReflectionWithSignatures,
) {
  const stack: Array<TypeDocReflectionWithSignatures> = [project]

  for (const reflection of stack) {
    stack.push(...(reflection.children ?? []))

    if (reflection.name !== 'createQueriesController') {
      continue
    }

    for (const signature of reflection.signatures ?? []) {
      const combinedResult = signature.typeParameters?.find(
        (typeParameter) => typeParameter.name === 'TCombinedResult',
      )

      if (!combinedResult?.default) {
        continue
      }

      const queryOptionsType = TypeDoc.ReferenceType.createBrokenReference(
        'TQueryOptions',
        project,
        undefined,
      )
      queryOptionsType.refersToTypeParameter = true

      // CreateQueriesResults is internal; render it as plain text, not a link.
      const queriesResultsType = TypeDoc.ReferenceType.createBrokenReference(
        'CreateQueriesResults',
        project,
        undefined,
      )
      queriesResultsType.typeArguments = [queryOptionsType]

      combinedResult.default = queriesResultsType
    }
  }
}

async function trimTrailingWhitespaceInMarkdown(outputDir: string) {
  const entries = await readdir(outputDir, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(outputDir, entry.name)

      if (entry.isDirectory()) {
        await trimTrailingWhitespaceInMarkdown(path)
        return
      }

      if (!entry.isFile() || !path.endsWith('.md')) {
        return
      }

      const markdown = await readFile(path, 'utf8')
      const trimmed = markdown.replace(/[ \t]+$/gm, '')

      if (trimmed !== markdown) {
        await writeFile(path, trimmed)
      }
    }),
  )
}

async function generatePackageReferenceDocs(pkg: PackageReferenceDocsConfig) {
  const outputDir = pkg.outputDir
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  const app = await TypeDoc.Application.bootstrapWithPlugins({
    plugin: [
      'typedoc-plugin-markdown',
      'typedoc-plugin-frontmatter',
      resolve(typedocConfigDir, './src/typedoc-custom-settings.js'),
    ],
    hideGenerator: true,
    readme: 'none',
    entryFileName: 'index',
    hideBreadcrumbs: true,
    hidePageHeader: true,
    useCodeBlocks: true,
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: pkg.excludeExternals,
    sourceLinkTemplate:
      'https://github.com/TanStack/query/blob/{gitRevision}/{path}#L{line}',
    gitRevision: 'main',
    entryPoints: pkg.entryPoints,
    tsconfig: pkg.tsconfig,
    exclude: pkg.exclude,
    out: outputDir,
  })

  const project = await app.convert()

  if (project) {
    if (pkg.simplifyLitQueriesControllerTypes) {
      simplifyLitQueriesControllerTypes(project)
    }

    await app.generateOutputs(project)

    if (pkg.trimGeneratedMarkdown) {
      await trimTrailingWhitespaceInMarkdown(outputDir)
    }
  }
}

for (const pkg of [
  {
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
    entryPoints: [resolve(__dirname, '../packages/svelte-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/svelte-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/svelte/reference'),
    exclude: ['./packages/query-core/**/*'],
  },
  {
    entryPoints: [resolve(__dirname, '../packages/preact-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/preact-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/preact/reference'),
    exclude: ['./packages/query-core/**/*'],
  },
  {
    entryPoints: [resolve(__dirname, '../packages/lit-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/lit-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/lit/reference'),
    exclude: ['./packages/query-core/**/*'],
    excludeExternals: true,
    simplifyLitQueriesControllerTypes: true,
    trimGeneratedMarkdown: true,
  },
] satisfies Array<PackageReferenceDocsConfig>) {
  await generatePackageReferenceDocs(pkg)
}

console.log('\n✅ All markdown files have been processed!')

process.exit(0)
