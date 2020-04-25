if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/react-query.production.min.js')
} else {
  module.exports = require('./dist/react-query.development.js')
}
