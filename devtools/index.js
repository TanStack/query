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
  module.exports = require('./development')
}
