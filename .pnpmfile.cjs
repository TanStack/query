function readPackage(pkg, context) {
  // react-scripts@4.0.3
  if (pkg.name === 'react-scripts' && pkg.version === '4.0.3') {
    delete pkg.dependencies['@typescript-eslint/eslint-plugin']
    delete pkg.dependencies['@typescript-eslint/parser']
    delete pkg.dependencies['babel-eslint']
    delete pkg.dependencies['babel-jest']
    delete pkg.dependencies['eslint']
    delete pkg.dependencies['eslint-config-react-app']
    delete pkg.dependencies['eslint-plugin-flowtype']
    delete pkg.dependencies['eslint-plugin-import']
    delete pkg.dependencies['eslint-plugin-jest']
    delete pkg.dependencies['eslint-plugin-jsx-a11y']
    delete pkg.dependencies['eslint-plugin-react']
    delete pkg.dependencies['eslint-plugin-react-hooks']
    delete pkg.dependencies['eslint-plugin-testing-library']
    delete pkg.dependencies['jest']
    delete pkg.dependencies['jest-circus']
    delete pkg.dependencies['jest-resolve']
    delete pkg.dependencies['jest-watch-typeahead']
    context.log('Removed unused dependencies from react-scripts@4.0.3')
  }

  // react-scripts@5.0.1
  if (pkg.name === 'react-scripts' && pkg.version === '5.0.1') {
    delete pkg.dependencies['babel-jest']
    delete pkg.dependencies['eslint']
    delete pkg.dependencies['eslint-config-react-app']
    delete pkg.dependencies['jest']
    delete pkg.dependencies['jest-resolve']
    delete pkg.dependencies['jest-watch-typeahead']
    context.log('Removed unused dependencies from react-scripts@5.0.1')
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
