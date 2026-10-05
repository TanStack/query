import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const typedocConfigPackageJson =
  require.resolve('@tanstack/typedoc-config/package.json')
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
      '@tanstack/typedoc-config/typedoc-custom-settings',
    ],
    hideGenerator: true,
    readme: 'none',
    entryFileName: 'index',
    hideBreadcrumbs: true,
    hidePageHeader: true,
    hidePageTitle: true,
    useCodeBlocks: true,
    // `parametersFormat` and `typeDeclarationFormat` are deliberately left as lists: the first
    // inlines the huge conditional types of `useQueries` into a single cell and drops `@default`
    // blocks, and the second collapses `@example` code blocks onto one line, which swallows the
    // following statement into a `//` comment.
    interfacePropertiesFormat: 'table',
    typeAliasPropertiesFormat: 'table',
    tableColumnSettings: {
      hideInherited: true,
      hideSources: true,
    },
    // Without this, a function property renders as `(data) => TData` — the table and list formats
    // both omit the parameter types otherwise.
    expandParameters: true,
    excludePrivate: true,
    excludeProtected: true,
    excludeInternal: true,
    excludeExternals: pkg.excludeExternals,
    sourceLinkTemplate:
      'https://github.com/TanStack/query/blob/{gitRevision}/{path}#L{line}',
    gitRevision: 'main',
    displayBasePath: resolve(__dirname, '..'),
    entryPoints: pkg.entryPoints,
    tsconfig: pkg.tsconfig,
    ...(pkg.exclude && { exclude: pkg.exclude }),
    out: outputDir,
  })

  const project = await app.convert()

  // `outputDir` was emptied above, so a failed conversion would otherwise leave it that way and
  // look like every page was intentionally deleted. Fail loudly instead — TypeDoc reports the
  // underlying diagnostics on stderr.
  //
  // The most likely cause is TS6305: `angular-query-experimental` reaches `@tanstack/query-devtools`
  // through a TypeScript project reference, so it consumes that package's emitted `.d.ts` rather than
  // its source (which is solid-js JSX and cannot be compiled under Angular's tsconfig). The
  // `generate-docs` script builds it first, so this should only surface if that build was skipped.
  if (!project) {
    throw new Error(
      `TypeDoc failed to convert ${pkg.entryPoints.join(', ')}. See the diagnostics above.`,
    )
  }

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

  await addReferenceDetails(outputDir)
}

// Splits the escaped type arguments (`\\<…\\>`) that follow a type name from the rest of the line.
function splitTypeArguments(rest: string) {
  if (!rest.startsWith('\\<')) {
    return { typeArguments: undefined, after: rest }
  }
  let depth = 0
  for (let index = 0; index < rest.length; index++) {
    if (rest.startsWith('\\<', index)) {
      depth++
    } else if (rest.startsWith('\\>', index) && --depth === 0) {
      return {
        typeArguments: rest.slice(2, index),
        after: rest.slice(index + 2),
      }
    }
  }
  return { typeArguments: undefined, after: rest }
}

// The type page a `Parameters`/`Returns` type line refers to when the whole line is that one type
// (with an optional default value), looking through wrappers that only change how the value is
// passed, i.e. aliases like `Accessor<T> = () => T` and inline `() => T`.
// Whether a type alias only changes how its single type argument is passed, e.g. `Accessor<T> = () => T`.
async function isWrapperAlias(outputDir: string, from: string) {
  const code = (await readPage(outputDir, from))?.match(
    /```ts\ntype \w+<(\w+)> = ([^\n]*);\n```/,
  )
  return (
    !!code &&
    code[2]!
      .split(' | ')
      .every((member) => member === code[1] || member === `() => ${code[1]}`)
  )
}

// The type page a `Parameters`/`Returns` type line refers to when the whole line is that one type
// (with an optional default value), looking through wrappers that only change how the value is
// passed, i.e. aliases like `Accessor<T> = () => T` and inline `() => T`.
async function linkedTypePage(outputDir: string, typeLine: string) {
  let line = typeLine
  for (;;) {
    line = line.replace(/^\(\) => /, '')
    const link = line.match(
      /^\[`\w+`\]\(\.\.\/((?:interfaces|type-aliases)\/\w+)\.md\)/,
    )
    if (!link) {
      return undefined
    }
    const { typeArguments, after } = splitTypeArguments(
      line.slice(link[0].length),
    )
    if (typeArguments && (await isWrapperAlias(outputDir, link[1]!))) {
      line = typeArguments
      continue
    }
    return after === '' || after.startsWith(' = ') ? link[1] : undefined
  }
}

// The name of the type a signature's code starts with, looking through the same wrappers.
async function typeNameInCode(outputDir: string, code: string) {
  let type = code
  for (;;) {
    type = type.replace(/^\(\) => /, '')
    const name = type.match(/^\w+/)?.[0]
    if (
      !name ||
      type[name.length] !== '<' ||
      !(await isWrapperAlias(outputDir, `type-aliases/${name}`))
    ) {
      return name
    }
    let depth = 0
    for (let index = name.length; index < type.length; index++) {
      if (type[index] === '<') {
        depth++
      } else if (
        type[index] === '>' &&
        type[index - 1] !== '=' &&
        --depth === 0
      ) {
        type = type.slice(name.length + 1, index)
        break
      }
    }
  }
}

// The property table for the first type line that has one.
async function findPropertiesTable(
  outputDir: string,
  typeLines: Array<string>,
) {
  for (const typeLine of typeLines) {
    const link = await linkedTypePage(outputDir, typeLine)
    const from = link && (await propertiesPage(outputDir, link))
    const table = from && (await readPropertiesTable(outputDir, from))
    if (table) {
      return table
    }
  }
  const bases = await findBasePages(outputDir, typeLines)
  if (bases.length) {
    return `Built from ${bases
      .map(
        (base) => `[\`${base.split('/').at(-1)}\`](../${base}.md#properties)`,
      )
      .join(', ')}. See the type above for what it changes.`
  }
  return undefined
}

// Splits a type expression at a top-level separator, outside `<>`, `()`, `{}`, and `[]`.
function splitTopLevel(type: string, separator: string) {
  const parts: Array<string> = []
  let depth = 0
  let start = 0
  for (let index = 0; index < type.length; index++) {
    const char = type[index]!
    if ('<({['.includes(char)) {
      depth++
    } else if (
      ')}]'.includes(char) ||
      (char === '>' && type[index - 1] !== '=')
    ) {
      depth--
    } else if (depth === 0 && type.startsWith(separator, index)) {
      parts.push(type.slice(start, index))
      start = index + separator.length
      index += separator.length - 1
    }
  }
  parts.push(type.slice(start))
  return parts.map((part) => part.trim()).filter(Boolean)
}

async function typePage(outputDir: string, name: string) {
  for (const from of [`interfaces/${name}`, `type-aliases/${name}`]) {
    if ((await readPage(outputDir, from)) !== undefined) {
      return from
    }
  }
  return undefined
}

// The pages with a `## Properties` table that a type expression without one is built from: every
// member of an intersection (skipping object literals, which only add properties), and the first type
// argument of a utility that isn't built from one itself, like `Omit<…>`. Returns nothing unless every part is found.
async function basePagesOfType(
  outputDir: string,
  type: string,
  seen: Set<string>,
): Promise<Array<string>> {
  const expression = splitTopLevel(type, ' = ')[0]!
    .replace(/^[|&]\s*/, '')
    .replace(/^\(\) => /, '')
    .trim()
  const members = splitTopLevel(expression, ' & ').filter(
    (member) => member !== 'object' && !member.startsWith('{'),
  )
  if (members.length > 1) {
    const pages: Array<string> = []
    for (const member of members) {
      const memberPages = await basePagesOfType(outputDir, member, seen)
      if (!memberPages.length) {
        return []
      }
      pages.push(...memberPages)
    }
    return [...new Set(pages)]
  }
  const reference = members[0]?.match(/^(\w+)(?:<([\s\S]*)>)?$/)
  if (!reference) {
    return []
  }
  const [, name, typeArguments] = reference
  const [firstTypeArgument] = typeArguments
    ? splitTopLevel(typeArguments, ',')
    : []
  const page = await typePage(outputDir, name!)
  const pages =
    page && !(await isWrapperAlias(outputDir, page))
      ? await basePages(outputDir, page, seen)
      : []
  if (pages.length) {
    return pages
  }
  return firstTypeArgument
    ? basePagesOfType(outputDir, firstTypeArgument, seen)
    : []
}

async function basePages(
  outputDir: string,
  from: string,
  seen: Set<string>,
): Promise<Array<string>> {
  if (seen.has(from)) {
    return []
  }
  seen.add(from)
  const page = await propertiesPage(outputDir, from)
  if (page) {
    return [page]
  }
  const code = (await readPage(outputDir, from))?.match(
    /```ts\ntype \w+(?:<[^\n=]*>)? = ([\s\S]*?);\n```/,
  )?.[1]
  return code ? basePagesOfType(outputDir, code, seen) : []
}

// The base pages of the first type line that has any.
async function findBasePages(outputDir: string, typeLines: Array<string>) {
  for (const typeLine of typeLines) {
    const type = typeLine
      .replace(/\[`?(\w+)`?\]\([^)]*\)/g, '$1')
      .replace(/[\\`]/g, '')
    const pages = await basePagesOfType(outputDir, type, new Set())
    if (pages.length) {
      return pages
    }
  }
  return []
}

// The type line of each parameter and of the return value in one call signature.
function signatureTypes(signature: string) {
  const parametersHeading = signature.match(/\n#{2,3} Parameters\n/)
  const returnsHeading = signature.match(/\n#{2,3} Returns\n/)
  const parameters = parametersHeading
    ? signature.slice(
        parametersHeading.index! + parametersHeading[0].length - 1,
        returnsHeading?.index,
      )
    : ''
  // Only the headings one level below `Parameters`, not the properties of an inline object argument.
  const parameterHeading = '#'.repeat(
    (parametersHeading?.[0].trim().indexOf(' ') ?? 0) + 1,
  )
  return {
    parameters: new Map(
      [
        ...parameters.matchAll(
          new RegExp(`\\n${parameterHeading} (\\S+)\\n\\n([^\\n]*)`, 'g'),
        ),
      ].map(([, name, typeLine]) => [name!, typeLine!]),
    ),
    returns: returnsHeading
      ? signature
          .slice(returnsHeading.index! + returnsHeading[0].length)
          .trim()
          .split('\n')[0]!
      : undefined,
  }
}

function readPage(outputDir: string, from: string) {
  return readFile(resolve(outputDir, `${from}.md`), 'utf8').then(
    (source) => source,
    () => undefined,
  )
}

// Resolves a type page to the interface pages it stands for: itself when it has a `## Properties`
// table, or the members of a plain alias or union. Anything else (intersections, `Omit`, `Override`, …)
// resolves to nothing, since no generated table describes it as-is.
async function resolveInterfacePages(
  outputDir: string,
  from: string,
): Promise<Array<string> | undefined> {
  const source = await readPage(outputDir, from)
  if (source === undefined) {
    return undefined
  }
  if (source.includes('\n## Properties\n')) {
    return [from]
  }
  const code = source.match(
    /```ts\ntype \w+(?:<[^\n=]*>)? = ([\s\S]*?);\n```/,
  )?.[1]
  if (!code) {
    return undefined
  }
  let members = code
  while (/<[^<>]*>/.test(members)) {
    members = members.replace(/<[^<>]*>/g, '')
  }
  const names = members
    .split('|')
    .map((member) => member.trim())
    .filter(Boolean)
  if (!names.every((name) => /^\w+$/.test(name))) {
    return undefined
  }
  const pages: Array<string> = []
  for (const name of names) {
    const resolved =
      (await resolveInterfacePages(outputDir, `interfaces/${name}`)) ??
      (await resolveInterfacePages(outputDir, `type-aliases/${name}`))
    if (!resolved) {
      return undefined
    }
    pages.push(...resolved)
  }
  return pages
}

// The page whose `## Properties` table describes the type: the type itself, or the interface every
// member of a union extends.
async function propertiesPage(outputDir: string, from: string) {
  const pages = await resolveInterfacePages(outputDir, from)
  if (!pages?.length) {
    return undefined
  }
  if (pages.length === 1) {
    return pages[0]
  }
  const bases = new Set<string>()
  for (const page of pages) {
    const base = (await readPage(outputDir, page))?.match(
      /\n## Extends\n\n- \[`\w+`\]\((\w+)\.md\)[^\n]*\n\n##/,
    )?.[1]
    if (!base) {
      return undefined
    }
    bases.add(`${dirname(page)}/${base}`)
  }
  return bases.size === 1 ? [...bases][0] : undefined
}

async function readPropertiesTable(outputDir: string, from: string) {
  const source = await readPage(outputDir, from)
  const start = source?.indexOf('\n## Properties\n') ?? -1
  if (source === undefined || start === -1) {
    return undefined
  }
  const fromDir = dirname(from)
  return source
    .slice(start + '\n## Properties\n'.length)
    .trim()
    .replace(
      /\]\((?!https?:|#)([^)]+)\)/g,
      (_, link: string) =>
        `](../${link.startsWith('../') ? link.slice(3) : `${fromDir}/${link}`})`,
    )
}

// Adds to every function page without changing what TypeDoc generated: the properties of each
// argument and of the result, and an `## Overview` of every call signature on overloaded pages. The
// properties come from the generated page of the type, following plain aliases and, for a union,
// the interface all of its members extend. Types that override or omit properties get no table.
async function addReferenceDetails(outputDir: string) {
  const files = await readdir(resolve(outputDir, 'functions')).catch(
    () => [] as Array<string>,
  )
  for (const file of files.filter((name) => name.endsWith('.md'))) {
    const pagePath = `functions/${file.slice(0, -3)}`
    const pageFile = resolve(outputDir, `${pagePath}.md`)
    const page = await readFile(pageFile, 'utf8')
    const [head, ...signatures] = page.split('\n## Call Signature\n')
    const isOverloaded = signatures.length > 1
    const lastSignature = signatures.at(-1) ?? page

    // Property tables of the arguments whose type has a `## Properties` table, and of the result.
    const tables: Array<{
      id: string
      title: string
      table: string
      parameter?: string
    }> = []
    const parametersHeading = lastSignature.match(/\n#{2,3} Parameters\n/)
    const returnsHeading = lastSignature.match(/\n#{2,3} Returns\n/)
    const parameters = parametersHeading
      ? lastSignature.slice(
          parametersHeading.index! + parametersHeading[0].length - 1,
          returnsHeading?.index,
        )
      : ''
    // Overloads describe the same arguments with different types, so a table missing from the
    // last (most general) signature is taken from the latest earlier one that has it.
    const signatureTypeLines = (signatures.length ? signatures : [page])
      .map(signatureTypes)
      .reverse()
    for (const name of signatureTypeLines[0]!.parameters.keys()) {
      const table = await findPropertiesTable(
        outputDir,
        signatureTypeLines.flatMap((types) => types.parameters.get(name) ?? []),
      )
      if (!table) {
        continue
      }
      const argument = name.replace(/\\/g, '').replace(/\?$/, '')
      const key = argument === '__namedParameters' ? 'props' : argument
      tables.push({
        id: `${key}-properties`,
        title: `\`${key}\` properties`,
        table,
        parameter: name,
      })
    }
    const resultTable = await findPropertiesTable(
      outputDir,
      signatureTypeLines.flatMap((types) => types.returns ?? []),
    )
    if (resultTable) {
      tables.push({
        id: 'result-properties',
        title: 'Result properties',
        table: resultTable,
      })
    }

    // Property anchors are prefixed with the table's name, so they stay unique when two tables on
    // the same page list the same properties.
    const section = (
      level: number,
      { id, title, table }: (typeof tables)[number],
    ) =>
      `<a id="${id}"></a>\n\n${'#'.repeat(level)} ${title}\n\n${table.replace(
        /<a id="([^"]+)"><\/a>/g,
        `<a id="${id.replace(/-properties$/, '')}-$1"></a>`,
      )}`

    if (!isOverloaded) {
      // Put each table at the end of the section it describes, so nothing is repeated.
      let updated = page.trimEnd()
      for (const entry of tables) {
        const heading = entry.parameter
          ? `\n### ${entry.parameter}\n`
          : '\n## Returns\n'
        const level = entry.parameter ? 3 : 2
        const start = updated.indexOf(heading)
        if (start === -1) {
          continue
        }
        const next = updated
          .slice(start + heading.length)
          .search(new RegExp(`\\n#{1,${level}} `))
        const insertAt =
          next === -1 ? updated.length : start + heading.length + next
        updated = `${updated.slice(0, insertAt).trimEnd()}\n\n${section(level + 1, entry)}\n${updated.slice(insertAt)}`
      }
      await writeFile(pageFile, `${updated.trimEnd()}\n`)
      continue
    }

    const entries = await Promise.all(
      signatures.map(async (signature, index) => {
        const code = signature.match(/```ts\n([\s\S]*?)\n```/)?.[1] ?? ''
        const summary = signature
          .split('\n### ')[0]!
          .split('\n\n')
          .map((block) => block.trim())
          .find(
            (block) =>
              block !== '' &&
              !block.startsWith('```') &&
              !block.startsWith('Defined in:'),
          )
        const label = (
          await Promise.all(
            [
              code.match(/\((?:\w+\??): ([\s\S]*)/)?.[1],
              code.match(/\): ([\s\S]*)/)?.[1],
            ].map((type) => type && typeNameInCode(outputDir, type)),
          )
        )
          .filter(Boolean)
          .map((type) => `\`${type}\``)
          .join(' → ')
        return {
          code,
          line: `- [${label || `Call signature ${index + 1}`}](#call-signature-${index + 1})${summary ? `: ${summary.replace(/\n/g, ' ')}` : ''}`,
        }
      }),
    )
    // Repeat the last (most general) signature's `Parameters` and `Returns` once at the end, one
    // heading level up, with the property tables, so every argument and the result are listed together.
    const promote = (block: string) => block.replace(/^#(#+) /gm, '$1 ')
    let parametersSummary = parametersHeading
      ? `## Parameters\n\n${promote(parameters.trim())}`
      : ''
    for (const entry of tables.filter((table) => table.parameter)) {
      const heading = `\n### ${entry.parameter}\n`
      const start = parametersSummary.indexOf(heading)
      const next = parametersSummary
        .slice(start + heading.length)
        .search(/\n#{1,3} /)
      const insertAt =
        next === -1 ? parametersSummary.length : start + heading.length + next
      parametersSummary = `${parametersSummary.slice(0, insertAt).trimEnd()}\n\n${section(4, entry)}\n${parametersSummary.slice(insertAt)}`
    }
    const returnsBlock = returnsHeading
      ? lastSignature
          .slice(returnsHeading.index! + returnsHeading[0].length)
          .split(/\n#{2,3} /)[0]!
          .trim()
      : ''
    const resultEntry = tables.find((table) => !table.parameter)
    const summaries = [
      parametersSummary
        ? `<a id="parameters-summary"></a>\n\n${parametersSummary.trimEnd()}`
        : '',
      returnsBlock
        ? [
            '<a id="returns-summary"></a>',
            '',
            '## Returns',
            '',
            returnsBlock,
            ...(resultEntry ? ['', section(3, resultEntry)] : []),
          ].join('\n')
        : '',
    ].filter(Boolean)
    const links = [
      ...(parametersSummary ? ['[Parameters](#parameters-summary)'] : []),
      ...(returnsBlock ? ['[Returns](#returns-summary)'] : []),
    ]
    const overview = [
      '## Overview',
      '',
      '```ts',
      ...entries.map((entry) => entry.code),
      '```',
      '',
      ...entries.map((entry) => entry.line),
      ...(links.length > 0 ? ['', `See also: ${links.join(' · ')}`] : []),
    ].join('\n')
    const body = signatures
      .map(
        (signature, index) =>
          `\n<a id="call-signature-${index + 1}"></a>\n\n## Call Signature\n${signature}`,
      )
      .join('')
      .trimEnd()
    const appended = summaries.join('\n\n')
    await writeFile(
      pageFile,
      `${head!.trimEnd()}\n\n${overview}\n${body}${appended ? `\n\n${appended}` : ''}\n`,
    )
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
    redirectFrom: {
      'functions/infiniteQueryOptions': [
        'framework/vue/reference/infiniteQueryOptions',
      ],
      'functions/mutationOptions': ['framework/vue/reference/mutationOptions'],
      'functions/queryOptions': ['framework/vue/reference/queryOptions'],
      'functions/useInfiniteQuery': [
        'framework/vue/reference/useInfiniteQuery',
      ],
      'functions/useIsFetching': ['framework/vue/reference/useIsFetching'],
      'functions/useIsMutating': ['framework/vue/reference/useIsMutating'],
      'functions/useMutation': ['framework/vue/reference/useMutation'],
      'functions/useMutationState': [
        'framework/vue/reference/useMutationState',
      ],
      'functions/usePrefetchInfiniteQuery': [
        'framework/vue/reference/usePrefetchInfiniteQuery',
      ],
      'functions/usePrefetchQuery': [
        'framework/vue/reference/usePrefetchQuery',
      ],
      'functions/useQueries': ['framework/vue/reference/useQueries'],
      'functions/useQuery': ['framework/vue/reference/useQuery'],
      'functions/useQueryClient': ['framework/vue/reference/useQueryClient'],
    },
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
