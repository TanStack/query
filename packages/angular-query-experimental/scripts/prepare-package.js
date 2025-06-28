import fs from 'node:fs'
import path from 'node:path'

console.log('Running prepare package script')

/**
 * Files to link from the dist directory
 * @type {string[]}
 */
const FILES_TO_LINK = ['README.md', 'package.json']

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true })
}

console.log('Linking files')
for (const fileName of FILES_TO_LINK) {
  if (fs.existsSync(fileName)) {
    fs.linkSync(fileName, path.join('dist', fileName))
    console.log(`${fileName}`)
  } else {
    console.log(`${fileName} not found, skipping`)
  }
}

console.log('prepare package complete')
