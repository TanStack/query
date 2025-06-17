import { defineConfig, mergeConfig } from 'vitest/config'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import packageJson from './package.json'
import type { Options } from '@tanstack/config/vite'

function ensureImportFileExtension({
  content,
  extension,
}: {
  content: string
  extension: string
}) {
  // replace e.g. `import { foo } from './foo'` with `import { foo } from './foo.js'`
  content = content.replace(
    /(im|ex)port\s[\w{}/*\s,]+from\s['"](?:\.\.?\/)+?[^.'"]+(?=['"];?)/gm,
    `$&.${extension}`,
  )

  // replace e.g. `import('./foo')` with `import('./foo.js')`
  content = content.replace(
    /import\(['"](?:\.\.?\/)+?[^.'"]+(?=['"];?)/gm,
    `$&.${extension}`,
  )
  return content
}

const config = defineConfig({
  // fix from https://github.com/vitest-dev/vitest/issues/6992#issuecomment-2509408660
  resolve: {
    conditions: ['@tanstack/custom-condition'],
  },
  environments: {
    ssr: {
      resolve: {
        conditions: ['@tanstack/custom-condition'],
      },
    },
  },
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: { enabled: true, provider: 'istanbul', include: ['src/**/*'] },
    typecheck: { enabled: true },
    globals: true,
    restoreMocks: true,
  },
})

// copy from @tanstack/config/vite with changes:
// - dts outDir: dist/types
// - build - lib - fileName: [name.mjs]
// - rollup - output - preserveModulesRoot: src
export const tanstackViteConfig = (options: Options) => {
  const outDir = options.outDir ?? 'dist'
  const cjs = options.cjs ?? true

  return defineConfig({
    plugins: [
      externalizeDeps({ include: options.externalDeps ?? [] }),
      tsconfigPaths({
        projects: options.tsconfigPath ? [options.tsconfigPath] : undefined,
      }),
      dts({
        outDir: `dist/types`,
        entryRoot: options.srcDir,
        include: options.srcDir,
        exclude: options.exclude,
        tsconfigPath: options.tsconfigPath,
        compilerOptions: {
          module: 99, // ESNext
          declarationMap: false,
        },
        beforeWriteFile: (filePath, content) => {
          return {
            filePath,
            content: ensureImportFileExtension({ content, extension: 'js' }),
          }
        },
        afterDiagnostic: (diagnostics) => {
          if (diagnostics.length > 0) {
            console.error('Please fix the above type errors')
            process.exit(1)
          }
        },
      }),
    ],
    build: {
      outDir,
      minify: false,
      sourcemap: true,
      lib: {
        entry: options.entry,
        formats: cjs ? ['es', 'cjs'] : ['es'],
        fileName: () => '[name].mjs',
      },
      rollupOptions: {
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
  })
}

export default mergeConfig(
  config,
  tanstackViteConfig({
    cjs: false,
    entry: [
      './src/index.ts',
      './src/devtools-panel/index.ts',
      './src/devtools-panel/stub.ts',
      './src/devtools/index.ts',
      './src/devtools/stub.ts',
    ],
    exclude: ['src/__tests__'],
    srcDir: './src',
    tsconfigPath: 'tsconfig.prod.json',
  }),
)
