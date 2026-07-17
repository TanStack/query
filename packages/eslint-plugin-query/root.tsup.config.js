// @ts-check

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsup').Options}
 */
export function modernConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
    outDir: 'build/modern',
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['typescript'],
    footer: ({ format }) => {
      if (format === 'cjs') {
        // workaround for CJS default export
        // @see https://github.com/evanw/esbuild/issues/1182#issuecomment-1011414271
        return { js: `module.exports = module.exports.default` }
      }

      return
    },
  }
}

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsup').Options}
 */
export function legacyConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['es2020', 'node16'],
    outDir: 'build/legacy',
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['typescript'],
  }
}
