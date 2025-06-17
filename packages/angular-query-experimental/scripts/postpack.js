import { unlink, rmdir } from 'fs/promises'
import fg from 'fast-glob'

const constants = {
  IGNORE_FILES_PATTERNS: [
    'dist/**',
    'node_modules/**',
    '.git/**',
    'scripts/**',
  ],
  CLEANUP_FILES_GLOB: ['**/*.d.ts'],
  IGNORE_REMOVE_DIRECTORIES: [
    'dist/**',
    'node_modules/**',
    '.git/**',
    'scripts/**',
    'src/**',
  ],
}

async function postpack() {
  console.log(
    'Running postpack script to cleanup type declaration linked files used for publishing',
  )

  const typeFiles = await fg(constants.CLEANUP_FILES_GLOB, {
    ignore: constants.IGNORE_FILES_PATTERNS,
  })

  if (typeFiles.length === 0) {
    return
  }

  await Promise.all(typeFiles.map((file) => unlink(file)))

  const dirs = await fg(['**/'], {
    onlyDirectories: true,
    ignore: constants.IGNORE_REMOVE_DIRECTORIES,
  })

  // Remove empty directories (deepest first)
  const sortedDirs = dirs.sort(
    (a, b) => b.split('/').length - a.split('/').length,
  )
  await Promise.all(
    sortedDirs.map(
      (dir) => rmdir(dir).catch(() => {}), // Ignore errors (dir not empty)
    ),
  )
}

postpack().catch((error) => {
  console.error('Postpack failed:', error)
})
