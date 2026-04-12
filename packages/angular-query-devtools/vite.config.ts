import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import type { Options } from '@tanstack/vite-config'

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const queryDevtoolsEntry = path.join(
  packageDir,
  '../query-devtools/src/index.ts',
)

function ensureImportFileExtension({
  content,
  extension,
}: {
  content: string
  extension: string
}) {
  content = content.replace(
    /(im|ex)port\s[\w{}/*\s,]+from\s['"](?:\.\.?\/)+?[^.'"]+(?=['"];?)/gm,
    `$&.${extension}`,
  )

  content = content.replace(
    /import\(['"](?:\.\.?\/)+?[^.'"]+(?=['"];?)/gm,
    `$&.${extension}`,
  )
  return content
}

const config = defineConfig({
  resolve: {
    conditions: ['@tanstack/custom-condition'],
    ...(process.env.VITEST === 'true'
      ? {
          alias: {
            '@tanstack/query-devtools': queryDevtoolsEntry,
          },
        }
      : {}),
  },
})

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
        outDir,
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
      './src/stub.ts',
      './src/production/index.ts',
      './src/devtools-panel/index.ts',
      './src/devtools-panel/stub.ts',
      './src/devtools-panel/production/index.ts',
    ],
    exclude: ['src/__tests__'],
    srcDir: './src',
    tsconfigPath: 'tsconfig.prod.json',
  }),
)
