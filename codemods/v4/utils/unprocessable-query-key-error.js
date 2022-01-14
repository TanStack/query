class UnprocessableQueryKeyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnprocessableQueryKeyError'
  }
}

module.exports = UnprocessableQueryKeyError
