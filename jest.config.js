module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'text-summary'],
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['<rootDir>/types/'],
  moduleNameMapper: {
    'react-query': '<rootDir>/src/react/index.ts',
  },
}
