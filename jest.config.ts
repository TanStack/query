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
      [`${namespace}/${name}(.*)$`]: `<rootDir>/packages/./${name}/src/$1`,
    }),
    {},
  ),
}

module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'text-summary'],
  projects: packages.map((d: string) => ({
    displayName: d,
    clearMocks: true,
    testEnvironment: 'jsdom',
    testMatch: [`<rootDir>/packages/${d}/**/*.test.[jt]s?(x)`],
    setupFilesAfterEnv: [`<rootDir>/jest.setup.js`],
    snapshotFormat: {
      printBasicPrototype: false,
    },
    moduleNameMapper,
    preset: d.includes("solid") ? 'solid-jest/preset/browser' : undefined,
  })),
}
