import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

const projectDir = process.cwd()
const esmDir = resolve(projectDir, 'dist')
const outDir = resolve(process.cwd(), 'dist-cjs')
const esmOnlyPackages = new Set(['lit'])
const esmImportTypeRegex = /import type \{([^}]*)\} from (['"])([^'"]+)\2;/g
const esmValueImportRegex = /import \{([^}]*)\} from (['"])([^'"]+)\2;/g
const importTypeExpressionRegex = /import\((['"])([^'"]+)\1\)/g

await mkdir(outDir, { recursive: true })
await writeFile(
  resolve(outDir, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
  'utf8',
)

for (const declarationFile of await findDeclarationFiles(esmDir)) {
  const source = await readFile(declarationFile, 'utf8')
  const relativePath = relative(esmDir, declarationFile)
  const outputPath = resolve(outDir, relativePath.replace(/\.d\.ts$/, '.d.cts'))

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, rewriteDeclaration(source), 'utf8')
}

async function findDeclarationFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = resolve(rootDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await findDeclarationFiles(entryPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.d.ts')) {
      files.push(entryPath)
    }
  }

  return files
}

function rewriteDeclaration(source) {
  return source
    .replace(/^\/\/# sourceMappingURL=.*$\n?/gm, '')
    .replace(/(['"])(\.\.?\/[^'"]+)\.js\1/g, '$1$2.cjs$1')
    .replace(esmImportTypeRegex, (match, specifiers, quote, packageName) => {
      if (!esmOnlyPackages.has(packageName)) {
        return match
      }

      return `import type {${specifiers}} from ${quote}${packageName}${quote} with { "resolution-mode": "import" };`
    })
    .replace(esmValueImportRegex, (match, specifiers, quote, packageName) => {
      if (!esmOnlyPackages.has(packageName)) {
        return match
      }

      return `import type {${specifiers}} from ${quote}${packageName}${quote} with { "resolution-mode": "import" };`
    })
    .replace(importTypeExpressionRegex, (match, quote, packageName) => {
      if (packageName !== 'lit-html') {
        return match
      }

      return `import(${quote}${packageName}${quote}, { with: { "resolution-mode": "import" } })`
    })
}
