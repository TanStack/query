/**
 * Helper subprocess for the hydration tests. Runs in plain node (vite/esbuild
 * cannot run inside the jsdom test worker): builds the fixture app twice
 * (server + hydratable client bundles), executes the SSR entry, and prints a
 * JSON report on stdout.
 *
 * Usage: node build-and-render.mjs <outDir>
 */
import { execFileSync } from 'node:child_process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import solidPlugin from 'vite-plugin-solid'

const fixtureDir = fileURLToPath(new URL('.', import.meta.url))
const packageRoot = path.join(fixtureDir, '..', '..', '..', '..')
const outDir = process.argv[2]
if (!outDir) {
  throw new Error('usage: node build-and-render.mjs <outDir>')
}

const alias = {
  '@tanstack/solid-query': path.join(packageRoot, 'src', 'index.ts'),
  '@tanstack/query-core': path.join(
    packageRoot,
    '..',
    'query-core',
    'src',
    'index.ts',
  ),
  'solid-js/web': '@solidjs/web',
}

// Server bundles: everything inlined so module resolution inside the temp
// output dir is a non-issue.
for (const entry of ['entry-server', 'entry-server-stream']) {
  await build({
    configFile: false,
    logLevel: 'error',
    plugins: [solidPlugin({ ssr: true })],
    resolve: { alias },
    ssr: { noExternal: true },
    build: {
      ssr: path.join(fixtureDir, `${entry}.tsx`),
      outDir,
      emptyOutDir: false,
      minify: false,
      target: 'node18',
      rollupOptions: {
        output: { entryFileNames: `${entry}.mjs` },
      },
    },
  })
}

// Client bundle: hydratable DOM output as a single self-contained ES module.
await build({
  configFile: false,
  logLevel: 'error',
  plugins: [solidPlugin({ ssr: true })],
  resolve: { alias },
  build: {
    outDir,
    emptyOutDir: false,
    minify: false,
    target: 'esnext',
    lib: {
      entry: path.join(fixtureDir, 'entry-client.tsx'),
      formats: ['es'],
      fileName: () => 'entry-client.mjs',
    },
  },
})

const report = execFileSync(
  process.execPath,
  [path.join(outDir, 'entry-server.mjs')],
  { encoding: 'utf-8' },
)
const streamReport = execFileSync(
  process.execPath,
  [path.join(outDir, 'entry-server-stream.mjs')],
  { encoding: 'utf-8' },
)

// Sanity-check both parse before handing them to the test.
const combined = JSON.stringify({
  string: JSON.parse(report),
  stream: JSON.parse(streamReport),
})
process.stdout.write(combined)
