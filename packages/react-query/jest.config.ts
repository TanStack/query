type ReactVersion = '19' | '18' | '17'

const version = (process.env.REACTJS_VERSION || '19') as ReactVersion

const reactModulesByVersion: Record<typeof version, Record<string, string>> = {
  '17': {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-18',
  },
  '18': {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-18',
  },
  '19': {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-18',
  },
}

export default {
  displayName: 'react-query',
  preset: '../../jest-preset.js',
  moduleNameMapper: reactModulesByVersion[version],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/codemods/**/*.test.js'],
}
