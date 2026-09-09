import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
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
  // Maps a generated page's path (relative to outputDir, no extension) to the flat
  // `docs/framework/<framework>/reference/<name>.md` URLs it replaced, so old links/bookmarks redirect
  // instead of falling through to the framework docs index. See https://github.com/TanStack/query/issues/11371
  redirectFrom?: Record<string, Array<string>>
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

async function addRedirectFromToFileFrontmatter(
  filePath: string,
  fromPaths: Array<string>,
) {
  const markdown = await readFile(filePath, 'utf8')

  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/)
  if (!frontmatterMatch) {
    throw new Error(`Expected frontmatter in ${filePath}`)
  }

  const redirectLines = fromPaths
    .map((fromPath) => `  - ${fromPath}`)
    .join('\n')
  const updatedFrontmatter = `---\n${frontmatterMatch[1]}\nredirect_from:\n${redirectLines}\n---\n`

  await writeFile(
    filePath,
    updatedFrontmatter + markdown.slice(frontmatterMatch[0].length),
  )
}

async function addRedirectFromToFrontmatter(
  outputDir: string,
  redirectFrom: Record<string, Array<string>>,
) {
  for (const [pagePath, fromPaths] of Object.entries(redirectFrom)) {
    await addRedirectFromToFileFrontmatter(
      resolve(outputDir, `${pagePath}.md`),
      fromPaths,
    )
  }
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
    hidePageTitle: true,
    useCodeBlocks: true,
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: pkg.excludeExternals,
    sourceLinkTemplate:
      'https://github.com/TanStack/query/blob/{gitRevision}/{path}#L{line}',
    gitRevision: 'main',
    entryPoints: pkg.entryPoints,
    tsconfig: pkg.tsconfig,
    ...(pkg.exclude && { exclude: pkg.exclude }),
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

    if (pkg.redirectFrom) {
      await addRedirectFromToFrontmatter(outputDir, pkg.redirectFrom)
    }
  }
}

const packages: Array<PackageReferenceDocsConfig> = [
  {
    entryPoints: [
      resolve(__dirname, '../packages/angular-query-experimental/src/index.ts'),
    ],
    tsconfig: resolve(
      __dirname,
      '../packages/angular-query-experimental/tsconfig.json',
    ),
    outputDir: resolve(__dirname, '../docs/framework/angular/reference'),
  },
  {
    entryPoints: [resolve(__dirname, '../packages/svelte-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/svelte-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/svelte/reference'),
  },
  {
    entryPoints: [resolve(__dirname, '../packages/solid-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/solid-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/solid/reference'),
    redirectFrom: {
      'functions/infiniteQueryOptions': [
        'framework/solid/reference/infiniteQueryOptions',
      ],
      'functions/mutationOptions': [
        'framework/solid/reference/mutationOptions',
      ],
      'functions/queryOptions': ['framework/solid/reference/queryOptions'],
      'functions/useInfiniteQuery': [
        'framework/solid/reference/useInfiniteQuery',
      ],
      'functions/useIsFetching': ['framework/solid/reference/useIsFetching'],
      'functions/useIsMutating': ['framework/solid/reference/useIsMutating'],
      'functions/useMutation': ['framework/solid/reference/useMutation'],
      'functions/useMutationState': [
        'framework/solid/reference/useMutationState',
      ],
      'functions/useQueries': ['framework/solid/reference/useQueries'],
      'functions/useQuery': ['framework/solid/reference/useQuery'],
    },
  },
  {
    entryPoints: [resolve(__dirname, '../packages/vue-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/vue-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/vue/reference'),
  },
  {
    entryPoints: [resolve(__dirname, '../packages/react-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/react-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/react/reference'),
    redirectFrom: {
      'functions/infiniteQueryOptions': [
        'framework/react/reference/infiniteQueryOptions',
      ],
      'functions/mutationOptions': [
        'framework/react/reference/mutationOptions',
      ],
      'functions/QueryClientProvider': [
        'framework/react/reference/QueryClientProvider',
      ],
      'functions/QueryErrorResetBoundary': [
        'framework/react/reference/QueryErrorResetBoundary',
      ],
      'functions/queryOptions': ['framework/react/reference/queryOptions'],
      'functions/useInfiniteQuery': [
        'framework/react/reference/useInfiniteQuery',
      ],
      'functions/useIsFetching': ['framework/react/reference/useIsFetching'],
      'functions/useIsMutating': ['framework/react/reference/useIsMutating'],
      'functions/useMutation': ['framework/react/reference/useMutation'],
      'functions/useMutationState': [
        'framework/react/reference/useMutationState',
      ],
      'functions/usePrefetchInfiniteQuery': [
        'framework/react/reference/usePrefetchInfiniteQuery',
      ],
      'functions/usePrefetchQuery': [
        'framework/react/reference/usePrefetchQuery',
      ],
      'functions/useQueries': ['framework/react/reference/useQueries'],
      'functions/useQuery': ['framework/react/reference/useQuery'],
      'functions/useQueryClient': ['framework/react/reference/useQueryClient'],
      'functions/useQueryErrorResetBoundary': [
        'framework/react/reference/useQueryErrorResetBoundary',
      ],
      'functions/useSuspenseInfiniteQuery': [
        'framework/react/reference/useSuspenseInfiniteQuery',
      ],
      'functions/useSuspenseQueries': [
        'framework/react/reference/useSuspenseQueries',
      ],
      'functions/useSuspenseQuery': [
        'framework/react/reference/useSuspenseQuery',
      ],
      // Redirects from the legacy hand-written docs/reference/*.md pages, removed in favor of
      // this generated reference.
      'classes/QueryClient': [
        'reference/QueryClient',
        'framework/react/reference/QueryClient',
      ],
      'classes/QueryCache': [
        'reference/QueryCache',
        'framework/react/reference/QueryCache',
      ],
      'classes/MutationCache': [
        'reference/MutationCache',
        'framework/react/reference/MutationCache',
      ],
      'classes/QueryObserver': [
        'reference/QueryObserver',
        'framework/react/reference/QueryObserver',
      ],
      'classes/InfiniteQueryObserver': [
        'reference/InfiniteQueryObserver',
        'framework/react/reference/InfiniteQueryObserver',
      ],
      'classes/QueriesObserver': [
        'reference/QueriesObserver',
        'framework/react/reference/QueriesObserver',
      ],
      // focusManager/onlineManager/timeoutManager are class instances, not object literals, so
      // TypeDoc can't inline their methods onto the `variables/*` instance page — the method docs
      // that the legacy pages covered now live on the `interfaces/*` page for the class itself.
      'interfaces/FocusManager': [
        'reference/focusManager',
        'framework/react/reference/focusManager',
      ],
      'interfaces/OnlineManager': [
        'reference/onlineManager',
        'framework/react/reference/onlineManager',
      ],
      'interfaces/TimeoutManager': ['reference/timeoutManager'],
      'variables/notifyManager': [
        'reference/notifyManager',
        'framework/react/reference/notifyManager',
      ],
      'variables/environmentManager': ['reference/environmentManager'],
      'functions/experimental_streamedQuery': ['reference/streamedQuery'],
    },
  },
  {
    entryPoints: [resolve(__dirname, '../packages/preact-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/preact-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/preact/reference'),
  },
  {
    entryPoints: [resolve(__dirname, '../packages/lit-query/src/index.ts')],
    tsconfig: resolve(__dirname, '../packages/lit-query/tsconfig.json'),
    outputDir: resolve(__dirname, '../docs/framework/lit/reference'),
    excludeExternals: true,
    simplifyLitQueriesControllerTypes: true,
    trimGeneratedMarkdown: true,
  },
]

for (const pkg of packages) {
  await generatePackageReferenceDocs(pkg)
}

console.log('\n✅ All markdown files have been processed!')

process.exit(0)
