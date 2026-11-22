// @ts-check

/**
 * @param {Object} opts - Options for building configurations.
 * @param {string[]} opts.entry - The entry array.
 * @returns {import('tsdown').UserConfig}
 */
export function getTsdownConfig(opts) {
  return {
    entry: opts.entry,
    format: 'esm',
    target: ['chrome91', 'firefox90', 'edge91', 'safari15', 'ios15', 'opera77'],
    // Rolldown lowers private fields for browser target arrays. Keep the
    // transform target at ES2022 to match the syntax that tsup emitted.
    inputOptions: { transform: { target: 'es2022' } },
    outDir: 'build',
    dts: true,
    fixedExtension: false,
    sourcemap: true,
    clean: true,
  }
}
