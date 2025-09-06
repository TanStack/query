const reactVersion = (process.env.REACTJS_VERSION || '19') as '17' | '18' | '19'
const reactModulesByVersion = {
  '17': {
    '^react((\\/.*)?)$': 'react-17$1',
    '^react-dom/client((\\/.*)?)$': 'react-dom-17$1',
    '^react-dom((\\/.*)?)$': 'react-dom-17$1',
    '^@testing-library/react': '@testing-library/react-17',
  },
  '18': {
    '^react((\\/.*)?)$': 'react-18$1',
    '^react-dom((\\/.*)?)$': 'react-dom-18$1',
    '^@testing-library/react': '@testing-library/react-18',
  },
  '19': {
    '^react((\\/.*)?)$': 'react$1',
    '^react-dom((\\/.*)?)$': 'react-dom$1',
    '^@testing-library/react': '@testing-library/react',
  },
}[reactVersion]

export default {
  displayName: 'react-query-persist-client',
  preset: '../../jest-preset.js',
  moduleNameMapper: reactModulesByVersion,
  setupFilesAfterEnv: ['./jest.setup.ts'],
}
