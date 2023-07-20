// @ts-check

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @param {boolean} [opts.bundle] - Whether to bundle the output.
 * @returns {import('tsup').Options}
 */
export function modernConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
    outDir: 'build/modern',
    bundle: opts.bundle || false,
    splitting: opts.bundle || false,
    dts: true,
    sourcemap: true,
    clean: true,
  }
}

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @param {boolean} [opts.bundle] - Whether to bundle the output.
 * @returns {import('tsup').Options}
 */
export function legacyConfig(opts) {
  return {
    entry: opts.entry,
    format: ['cjs', 'esm'],
    target: ['es2020', 'node16'],
    outDir: 'build/legacy',
    bundle: opts.bundle || false,
    splitting: opts.bundle || false,
    dts: true,
    sourcemap: true,
    clean: true,
  }
}
