const fs = require('fs')

const root = __dirname + '/../'
const packageJsonPath = root + 'package.json'

function removePrivate(name) {
  const pkg = require(name)
  if (pkg.private === true) {
    pkg.private = false
    fs.writeFileSync(name, JSON.stringify(pkg, null, 2))
  }
}

removePrivate(packageJsonPath)

const packageJson = require(packageJsonPath)

packageJson.workspaces.forEach((workspace) => {
  removePrivate(root + workspace + '/package.json')
})
