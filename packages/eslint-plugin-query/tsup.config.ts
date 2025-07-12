import { defineConfig } from 'tsup'

// @ts-ignore out of scope
import { legacyConfig, modernConfig } from '../../scripts/getTsupConfig.js'

export default defineConfig([
  {
    ...modernConfig({ entry: ['src/*.ts'] }),
    external: ['typescript'],
    footer: ({ format }) => {
      if (format === 'cjs') {
        // workaround for CJS default export
        // @see https://github.com/evanw/esbuild/issues/1182#issuecomment-1011414271
        return { js: `module.exports = module.exports.default` }
      }

      return
    },
    esbuildPlugins: undefined,
  },
  {
    ...legacyConfig({ entry: ['src/*.ts'] }),
    external: ['typescript'],
    esbuildPlugins: undefined,
  },
])
