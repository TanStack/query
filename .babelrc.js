const { NODE_ENV, BABEL_ENV } = process.env
const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs'
const loose = true

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        loose,
        modules: false,
        exclude: ['@babel/plugin-transform-regenerator'],
      },
    ],
    '@babel/preset-typescript',
    '@babel/react',
  ],
  plugins: [
    [
      'const-enum',
      {
        transform: 'constObject',
      },
    ],
    'babel-plugin-transform-async-to-promises',
    cjs && ['@babel/transform-modules-commonjs', { loose }],
    [
      '@babel/transform-runtime',
      {
        useESModules: !cjs,
        version: require('./package.json').dependencies[
          '@babel/runtime'
        ].replace(/^[^0-9]*/, ''),
      },
    ],
  ].filter(Boolean),
}
