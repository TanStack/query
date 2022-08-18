// This is the cjs fallback for bundlers that do not support exports.development conditional
if (process.env.NODE_ENV !== 'development') {
  module.exports = {
    ReactQueryDevtools: function () {
      return null
    },
    ReactQueryDevtoolsPanel: function () {
      return null
    },
  }
} else {
  module.exports = require('./build/lib/index.js')
}
