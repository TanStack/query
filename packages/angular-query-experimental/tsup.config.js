import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/devtools-panel/index.ts',
    'src/devtools-panel/stub.ts',
    'src/devtools/index.ts',
    'src/devtools/stub.ts',
    'src/index.ts',
  ],
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: {
    entry: [
      'src/devtools-panel/index.ts',
      'src/devtools-panel/production/index.ts',
      'src/devtools/index.ts',
      'src/devtools/production/index.ts',
      'src/index.ts',
    ],
  },
  outDir: 'build',
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.js' }
  },
  splitting: false,
})

process.on('beforeExit', (code) => {
  if (code === 0) {
    const files = [
      {
        from: 'package.json',
        to: 'build/package.json',
      },
      { from: 'README.md', to: 'build/README.md' },
    ]

    for (const { from, to } of files) {
      mkdirSync(dirname(to), { recursive: true })
      copyFileSync(from, to)
    }
  }
})
