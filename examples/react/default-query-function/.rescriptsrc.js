const path = require('path')
const resolveFrom = require('resolve-from')

const fixLinkedDependencies = config => {
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      react$: resolveFrom(path.resolve('node_modules'), 'react'),
      'react-dom$': resolveFrom(path.resolve('node_modules'), 'react-dom'),
    },
  }
  return config
}

const includeSrcDirectory = config => {
  config.resolve = {
    ...config.resolve,
    modules: [path.resolve('src'), ...config.resolve.modules],
  }
  return config
}

module.exports = [
  ['use-babel-config', '.babelrc'],
  ['use-eslint-config', '.eslintrc'],
  fixLinkedDependencies,
  // includeSrcDirectory,
]
