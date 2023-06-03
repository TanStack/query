// @ts-check
import withSolid from 'rollup-preset-solid'

const config = withSolid({
  input: 'src/index.tsx',
  targets: ['esm', 'cjs'],
})

if (!Array.isArray(config)) {
  config.external = []
}

export default config
