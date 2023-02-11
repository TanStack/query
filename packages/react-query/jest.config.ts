export default {
  displayName: 'react-query',
  preset: '../../jest-preset.js',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/codemods/**/*.test.js'],
}
