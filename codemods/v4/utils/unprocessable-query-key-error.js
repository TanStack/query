class UnprocessableKeyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnprocessableKeyError'
  }
}

module.exports = UnprocessableKeyError
