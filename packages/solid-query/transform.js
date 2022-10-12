const babelJest = require('babel-jest')

module.exports = babelJest.default.createTransformer({
  presets: [
    'babel-preset-solid',
    '@babel/preset-env',
    '@babel/preset-typescript',
  ],
})
