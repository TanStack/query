import { existsSync, readFileSync, statSync } from 'node:fs'
import path, { resolve } from 'node:path'
import { glob } from 'tinyglobby'
// @ts-ignore Could not find a declaration file for module 'markdown-link-extractor'.
import markdownLinkExtractor from 'markdown-link-extractor'

function isRelativeLink(link: string) {
  return (
    link &&
    !link.startsWith('http://') &&
    !link.startsWith('https://') &&
    !link.startsWith('//') &&
    !link.startsWith('#') &&
    !link.startsWith('mailto:')
  )
}

function normalizePath(p: string): string {
  // Remove any trailing .md
  p = p.replace(`${path.extname(p)}`, '')
  return p
}

function fileExistsForLink(
  link: string,
  markdownFile: string,
  errors: Array<any>,
): boolean {
  // Remove hash if present
  const filePart = link.split('#')[0]
  // If the link is empty after removing hash, it's not a file
  if (!filePart) return false

  // Normalize the markdown file path
  markdownFile = normalizePath(markdownFile)

  // Normalize the path
  const normalizedPath = normalizePath(filePart)

  // Resolve the path relative to the markdown file's directory
  let absPath = resolve(markdownFile, normalizedPath)

  // Ensure the resolved path is within /docs
  const docsRoot = resolve('docs')
  if (!absPath.startsWith(docsRoot)) {
    errors.push({
      link,
      markdownFile,
      resolvedPath: absPath,
      reason: 'navigates above /docs, invalid',
    })
    return false
  }

  // Check if this is an example path
  const isExample = absPath.includes('/examples/')

  let exists = false

  if (isExample) {
    // Transform /docs/framework/{framework}/examples/ to /examples/{framework}/
    absPath = absPath.replace(
      /\/docs\/framework\/([^/]+)\/examples\//,
      '/examples/$1/',
    )
    // For examples, we want to check if the directory exists
    exists = existsSync(absPath) && statSync(absPath).isDirectory()
  } else {
    // For non-examples, we want to check if the .md file exists
    if (!absPath.endsWith('.md')) {
      absPath = `${absPath}.md`
    }
    exists = existsSync(absPath)
  }

  if (!exists) {
    errors.push({
      link,
      markdownFile,
      resolvedPath: absPath,
      reason: 'not found',
    })
  }
  return exists
}

async function findMarkdownLinks() {
  // Find all markdown files in docs directory
  const markdownFiles = await glob('docs/**/*.md', {
    ignore: ['**/node_modules/**'],
  })

  console.log(`Found ${markdownFiles.length} markdown files\n`)

  const errors: Array<any> = []

  // Process each file
  for (const file of markdownFiles) {
    const content = readFileSync(file, 'utf-8')
    const links: Array<any> = markdownLinkExtractor(content)

    const filteredLinks = links.filter((link: any) => {
      if (typeof link === 'string') {
        return isRelativeLink(link)
      } else if (link && typeof link.href === 'string') {
        return isRelativeLink(link.href)
      }
      return false
    })

    if (filteredLinks.length > 0) {
      filteredLinks.forEach((link) => {
        const href = typeof link === 'string' ? link : link.href
        fileExistsForLink(href, file, errors)
      })
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} broken links:`)
    errors.forEach((err) => {
      console.log(
        `${err.link}\n  in:    ${err.markdownFile}\n  path:  ${err.resolvedPath}\n  why:   ${err.reason}\n`,
      )
    })
    process.exit(1)
  } else {
    console.log('\n✅ No broken links found!')
  }
}

findMarkdownLinks().catch(console.error)
