export default {
  displayName: 'react-query',
  preset: '../../jest-preset.js',
  moduleNameMapper: {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-18',
  },
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/codemods/**/*.test.js'],
}
