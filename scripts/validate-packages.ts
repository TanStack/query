import { packages, rootDir } from './config'
import path from 'path'
import fsp from 'fs/promises'
import jsonfile from 'jsonfile'

import type { PackageJson } from 'type-fest'

async function run() {
  console.info('Validating packages...')
  const failedValidations: string[] = []

  await Promise.all(
    packages.map(async (pkg) => {
      const pkgJson = await readPackageJson(
        path.resolve(rootDir, 'packages', pkg.packageDir, 'package.json'),
      )

      await Promise.all(
        pkg.entries.map(async (entryKey) => {
          const entry = pkgJson[entryKey] as unknown

          if (typeof entry !== 'string') {
            throw new Error(
              `Missing entry for "${entryKey}" in ${pkg.packageDir}/package.json!`,
            )
          }

          const filePath = path.resolve(
            rootDir,
            'packages',
            pkg.packageDir,
            entry,
          )

          try {
            await fsp.access(filePath)
          } catch (err) {
            failedValidations.push(`Missing build file: ${filePath}`)
          }
        }),
      )

      const defaultExport = pkgJson.exports?.['.']?.['default'] as unknown

      if (typeof defaultExport !== 'string') {
        throw new Error(
          `Missing exports['.']['default'] in ${pkg.packageDir}/package.json!`,
        )
      }

      const filePath = path.resolve(
        rootDir,
        'packages',
        pkg.packageDir,
        defaultExport,
      )

      try {
        await fsp.access(filePath)
      } catch (err) {
        failedValidations.push(`Missing build file: ${filePath}`)
      }
    }),
  )
  console.info('')
  if (failedValidations.length > 0) {
    throw new Error(
      'Some packages failed validation:\n\n' + failedValidations.join('\n'),
    )
  }
}

run().catch((err) => {
  console.info(err)
  process.exit(1)
})

async function readPackageJson(pathName: string) {
  return (await jsonfile.readFile(pathName)) as PackageJson
}
