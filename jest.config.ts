const path = require('path')
const { lstatSync, readdirSync } = require('fs')

// get listing of packages in the mono repo
const basePath = path.resolve(__dirname, 'packages')
const packages = readdirSync(basePath).filter((name) => {
  return lstatSync(path.join(basePath, name)).isDirectory()
})

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
  projects: packages.map((d) => ({
    displayName: d,
    testEnvironment: 'jsdom',
    testMatch: [`<rootDir>/package/${d}/**/*.test.[jt]s?(x)`],
    setFilesAfterEnv: [`<rootDir>/packages/${d}/__tests__/jest.setup.js`],
    snapshotFormat: {
      printBasicPrototype: false,
    },
    moduleNameMapper,
  })),
}
