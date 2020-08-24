if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/hydration/react-query-hydration.production.min.js')
} else {
  module.exports = require('./dist/hydration/react-query-hydration.development.js')
}
