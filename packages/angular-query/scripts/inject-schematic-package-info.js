import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const queryPackage = readPackageJson(path.join(packageDir, 'package.json'))
const devtoolsPackage = readPackageJson(
  path.resolve(packageDir, '../angular-query-devtools/package.json'),
)

const replacements = new Map([
  ['__ANGULAR_QUERY_PACKAGE_NAME__', queryPackage.name],
  ['__ANGULAR_QUERY_PACKAGE_VERSION__', queryPackage.version],
  ['__ANGULAR_QUERY_DEVTOOLS_PACKAGE_NAME__', devtoolsPackage.name],
  ['__ANGULAR_QUERY_DEVTOOLS_PACKAGE_VERSION__', devtoolsPackage.version],
])

for (const schematic of ['ng-add', 'migrate-from-experimental']) {
  const outputPath = path.join(
    packageDir,
    `dist/schematics/${schematic}/index.js`,
  )
  let output = fs.readFileSync(outputPath, 'utf8')
  for (const [placeholder, value] of replacements) {
    output = output.replaceAll(placeholder, value)
  }
  if (output.includes('__ANGULAR_QUERY_')) {
    throw new Error(`Unresolved package metadata in ${outputPath}.`)
  }
  fs.writeFileSync(outputPath, output)
}

/**
 * @param {string} packageJsonPath
 * @returns {{ name: string; version: string }}
 */
function readPackageJson(packageJsonPath) {
  const value = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  if (typeof value.name !== 'string' || typeof value.version !== 'string') {
    throw new Error(`Invalid package metadata in ${packageJsonPath}.`)
  }

  return value
}
