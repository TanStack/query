import { readFileSync } from 'node:fs'
import { glob } from 'tinyglobby'

const FORBIDDEN_PATTERNS = [
  /\bfrom\s+['"]vite['"]/,
  /\bfrom\s+['"]tsup['"]/,
  /\bfrom\s+['"]vitest/,
  /\/\/\/\s*<reference\s+types=["']node["']\s*\/>/,
]

const errors: Array<{ file: string; line: number; text: string }> = []

const files = await glob(['packages/*/build/**/*.d.ts', 'packages/*/build/**/*.d.cts'])

if (files.length === 0) {
  console.error(
    'ERROR: No declaration files found under packages/*/build. Ensure the build step produced .d.ts outputs before verification.',
  )
  process.exit(1)
}

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        errors.push({ file, line: i + 1, text: line.trim() })
      }
    }
  }
}

if (errors.length > 0) {
  console.error(
    'ERROR: Build tool types leaked into published .d.ts files:\n',
  )
  for (const error of errors) {
    console.error(`  ${error.file}:${error.line}`)
    console.error(`    ${error.text}\n`)
  }
  console.error(
    'This usually means a tsconfig.prod.json is missing "include": ["src"].',
  )
  console.error(
    'See https://github.com/TanStack/query/issues/10294 for details.',
  )
  process.exit(1)
} else {
  console.log(
    `Verified ${files.length} .d.ts files — no build tool type leaks found.`,
  )
}
