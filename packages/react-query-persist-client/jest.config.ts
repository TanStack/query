const version = process.env.REACTJS_VERSION || '19'

const reactModulesByVersion = {
  '17': {
    '^react((\\/.*)?)$': 'react-17$1',
    '^react-dom((\\/.*)?)$': 'react-dom-17$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-17',
  },
  '18': {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react-18',
  },
  '19': {
    '^react((\\/.*)?)$': 'react$1',
    '^react-dom((\\/.*)?)$': 'react-dom$1',
    '^@testing-library/react(?:/.*)?$': '@testing-library/react',
  },
}

export default {
  displayName: 'react-query',
  preset: '../../jest-preset.js',
  moduleNameMapper: reactModulesByVersion[version],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/codemods/**/*.test.js'],
}
