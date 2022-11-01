const path = require('path')
const { lstatSync, readdirSync } = require('fs')

// get listing of packages in the mono repo
const basePath = path.resolve(__dirname, 'packages')
const packages = readdirSync(basePath)
  .filter((name) => {
    return lstatSync(path.join(basePath, name)).isDirectory()
  })
  .sort((a, b) => b.length - a.length)

const { namespace } = require('./package.json')

const moduleNameMapper = {
  ...packages.reduce(
    (acc, name) => ({
      ...acc,
      [`${namespace}/${name}(.*)$`]: `<rootDir>/../../packages/./${name}/src/$1`,
    }),
    {},
  ),
}

module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'text-summary'],
  testMatch: ['<rootDir>/**/src/**/*.test.[jt]s?(x)'],
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  clearMocks: true,
  testEnvironment: 'jsdom',
  snapshotFormat: {
    printBasicPrototype: false,
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        exclude: ['**'],
      },
    },
  },
  moduleNameMapper,
}
