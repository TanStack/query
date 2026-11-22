// @ts-check

// Query Core uses Promise.withResolvers().
export const browserTargets = [
  'chrome119',
  'firefox121',
  'edge119',
  'safari17.4',
  'ios17.4',
  'opera105',
]

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsdown').UserConfig}
 */
export function getTsdownConfig(opts) {
  return {
    entry: opts.entry,
    format: 'esm',
    target: browserTargets,
    outDir: 'build',
    dts: true,
    fixedExtension: false,
    sourcemap: true,
    clean: true,
  }
}
