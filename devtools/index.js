if (process.env.NODE_ENV !== 'development') {
  module.exports = require('../lib/devtools/noop')
} else {
  module.exports = require('../lib/devtools/index')
}
