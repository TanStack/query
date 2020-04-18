module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'text-summary'],
  testPathIgnorePatterns: ['<rootDir>/types/'],
}
