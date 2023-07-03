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
    target: ['chrome84', 'firefox90', 'edge84', 'safari15', 'ios15', 'opera70'],
    outDir: 'build/modern',
    bundle: false,
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: true,
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
    bundle: false,
    splitting: false,
    dts: true,
    sourcemap: true,
    clean: true,
  }
}
