if (process.env.NODE_ENV === 'production') {
  module.exports = require('../dist/react-query-devtools.development.min.js')
} else {
  module.exports = require('../dist/react-query-devtools.development.js')
}
