const path = __dirname + '/../package.json'
const pkg = require(path)
pkg.private = false
require('fs').writeFileSync(path, JSON.stringify(pkg, null, 2))
