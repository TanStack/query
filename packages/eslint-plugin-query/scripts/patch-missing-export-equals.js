// @ts-check

// https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/MissingExportEquals.md

import fs from 'node:fs/promises'
import path from 'node:path'

const projectDir = new URL('..', import.meta.url).pathname

const dtsFiles = [
  path.join(projectDir, 'dist/index.d.ts'),
  path.join(projectDir, 'dist/index.d.cts'),
]

for (const file of dtsFiles) {
  await fs.appendFile(file, '\n\nexport = plugin')
  console.log(`Appended \`export = plugin\` to ${path.relative(projectDir, file)}`)
}
