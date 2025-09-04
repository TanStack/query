import fs from 'node:fs'
import path from 'node:path'

/**
 * Prepack script that prepares the package for publishing by:
 * 1. Creating a modified package.json without dev dependencies, publishConfig and build scripts
 * 2. Updating file paths to remove 'dist/' prefixes (since files will be at root in published package)
 * 3. Writing this modified package.json to the `dist` directory
 * 4. Copying additional files like README.md to the dist directory
 *
 * Type declarations need to be in the package root or corresponding sub-path to support
 * sub-path exports in applications still using `moduleResolution: node`.
 */

console.log('Running prepack script')

/**
 * Files to copy to the dist directory
 * @type {string[]}
 */
const FILES_TO_COPY = ['README.md']

/**
 * Fields to remove from the package.json copy
 * @type {string[]}
 */
const FIELDS_TO_REMOVE = [
  'devDependencies',
  'files',
  'publishConfig',
  'scripts',
]

/**
 * Replaces 'dist/' or './dist/' prefix from a file path with './'
 * Only matches at the start of the path to avoid false matches
 * @param {string} filePath - The file path to process
 * @returns {string} The path without dist prefix
 */
function replaceDist(filePath) {
  // Only match dist/ at the beginning of the path, followed by a filename
  // This prevents matching strings like "distributed/file.js" or "some/dist/path"
  return filePath.replace(/^(?:\.\/)?dist\/(?=.+)/, './')
}

/**
 * Recursively processes package.json `exports` to remove dist prefixes
 * @param {Record<string, any>} exports - The exports object to process
 * @returns {Record<string, any>} The processed exports object
 */
function processExports(exports) {
  return Object.fromEntries(
    Object.entries(exports).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? replaceDist(value)
        : typeof value === 'object' && value !== null
          ? processExports(value)
          : value,
    ]),
  )
}

console.log('Copying modified package.json')

/** @type {Record<string, any>} */
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const modifiedPackageJson = { ...packageJson }

if (modifiedPackageJson.types) {
  modifiedPackageJson.types = replaceDist(modifiedPackageJson.types)
}

if (modifiedPackageJson.module) {
  modifiedPackageJson.module = replaceDist(modifiedPackageJson.module)
}

if (modifiedPackageJson.exports) {
  modifiedPackageJson.exports = processExports(modifiedPackageJson.exports)
}

for (const field of FIELDS_TO_REMOVE) {
  delete modifiedPackageJson[field]
}

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true })
}

fs.writeFileSync(
  path.join('dist', 'package.json'),
  JSON.stringify(modifiedPackageJson, null, 2),
)

console.log('Copying other files')
for (const file of FILES_TO_COPY) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file))
    console.log(`${file}`)
  } else {
    console.log(`${file} not found, skipping`)
  }
}

console.log('prepack complete')
