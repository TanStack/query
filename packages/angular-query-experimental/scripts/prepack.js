import fs from 'node:fs'
import path from 'node:path'

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
 * @param {string} filePath - The file path to process
 * @returns {string} The path without dist prefix
 */
function removeDist(filePath) {
  return filePath.replace(/^(\.\/)?dist\//, './')
}

/**
 * Recursively processes exports object to remove dist prefixes
 * @param {Record<string, any>} exports - The exports object to process
 * @returns {Record<string, any>} The processed exports object
 */
function processExports(exports) {
  return Object.fromEntries(
    Object.entries(exports).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? removeDist(value)
        : typeof value === 'object' && value !== null
          ? processExports(value)
          : value,
    ]),
  )
}

console.log('Copying modified package.json')

/** @type {Record<string, any>} */
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const distPackageJson = { ...packageJson }

if (distPackageJson.types) {
  distPackageJson.types = removeDist(distPackageJson.types)
}

if (distPackageJson.module) {
  distPackageJson.module = removeDist(distPackageJson.module)
}

if (distPackageJson.exports) {
  distPackageJson.exports = processExports(distPackageJson.exports)
}

for (const field of FIELDS_TO_REMOVE) {
  delete distPackageJson[field]
}

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true })
}

fs.writeFileSync(
  path.join('dist', 'package.json'),
  JSON.stringify(distPackageJson, null, 2),
)

console.log('Copying other files')
for (const fileName of FILES_TO_COPY) {
  if (fs.existsSync(fileName)) {
    fs.copyFileSync(fileName, path.join('dist', fileName))
    console.log(`${fileName}`)
  } else {
    console.log(`${fileName} not found, skipping`)
  }
}

console.log('prepack complete')
