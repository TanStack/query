// @ts-check

import path from 'node:path'
import fsp from 'node:fs/promises'
import jsonfile from 'jsonfile'
import { publint } from 'publint'
import { packages, rootDir } from './config.mjs'

async function run() {
  console.info('Validating packages...')
  /** @type {string[]} */
  const failedValidations = []

  await Promise.all(
    packages.map(async (pkg) => {
      const pkgJson = await readPackageJson(
        path.resolve(rootDir, pkg.packageDir, 'package.json'),
      )

      await Promise.all(
        pkg.entries.map(async (entryKey) => {
          const entry = /** @type {unknown} */ (pkgJson[entryKey])

          if (typeof entry !== 'string') {
            throw new Error(
              `Missing entry for "${entryKey}" in ${pkg.packageDir}/package.json!`,
            )
          }

          const filePath = path.resolve(rootDir, pkg.packageDir, entry)

          try {
            await fsp.access(filePath)
          } catch (err) {
            failedValidations.push(`Missing build file: ${filePath}`)
          }
        }),
      )

      const defaultExport = /** @type {unknown} */ (
        pkgJson.exports?.['.']?.['default']
      )

      if (typeof defaultExport !== 'string') {
        throw new Error(
          `Missing exports['.']['default'] in ${pkg.packageDir}/package.json!`,
        )
      }

      const filePath = path.resolve(rootDir, pkg.packageDir, defaultExport)

      try {
        await fsp.access(filePath)
      } catch (err) {
        failedValidations.push(`Missing build file: ${filePath}`)
      }

      const publintResult = await publint({ pkgDir: pkg.packageDir })

      publintResult.forEach((message) => {
        failedValidations.push(
          `Publint warning: ${JSON.stringify(message, null, 2)}`,
        )
      })
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

/**
 * @param {string} pathName
 * @returns {Promise<import('type-fest').PackageJson>}
 */
async function readPackageJson(pathName) {
  return await jsonfile.readFile(pathName)
}
