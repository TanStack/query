const { NODE_ENV, BABEL_ENV } = process.env
const cjs = NODE_ENV === 'test' || BABEL_ENV === 'commonjs'
const es = BABEL_ENV === 'es'
const loose = true

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose,
        modules: false,
        exclude: [
          '@babel/plugin-transform-regenerator',
          '@babel/plugin-transform-parameters',
        ],
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    cjs && ['@babel/transform-modules-commonjs', { loose }],
    es && ['babel-plugin-add-import-extension', { extension: 'mjs' }],
    // no runtime for umd builds
    BABEL_ENV && [
      '@babel/transform-runtime',
      {
        version: require('./package.json').dependencies[
          '@babel/runtime'
        ].replace(/^[^0-9]*/, ''),
      },
    ],
  ].filter(Boolean),
  overrides: [
    {
      include: [
        './packages/react-query/**',
        './packages/react-query-devtools/**',
        './packages/react-query-persist-client/**',
      ],
      presets: ['@babel/react'],
    },
    {
      include: './packages/solid-query/**',
      presets: ['babel-preset-solid'],
    },
  ],
}
