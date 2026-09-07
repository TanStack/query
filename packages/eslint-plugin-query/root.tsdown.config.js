// @ts-check

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsdown').UserConfig}
 */
export function modernConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
    outDir: 'build/modern',
    dts: true,
    fixedExtension: false,
    sourcemap: true,
    clean: true,
    deps: { neverBundle: ['typescript'] },
    footer: ({ format, fileName }) =>
      format === 'cjs' && fileName.endsWith('index.cjs')
        ? 'module.exports = module.exports.default'
        : undefined,
    outputOptions: {
      exports: 'named',
    },
  }
}

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsdown').UserConfig}
 */
export function legacyConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['es2020', 'node16'],
    outDir: 'build/legacy',
    dts: true,
    fixedExtension: false,
    sourcemap: true,
    clean: true,
    deps: { neverBundle: ['typescript'] },
    outputOptions: {
      exports: 'named',
    },
  }
}
