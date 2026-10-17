import { isBuiltin } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const angularQueryEntry = path.join(
  packageDir,
  '../angular-query/dist/index.mjs',
)
const angularQueryInternalEntry = path.join(
  packageDir,
  '../angular-query/dist/internal.mjs',
)
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

const externalDependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
})

export default defineConfig({
  resolve: {
    conditions: ['@tanstack/custom-condition'],
    ...(process.env.VITEST === 'true'
      ? {
          alias: {
            '@tanstack/angular-query/internal': angularQueryInternalEntry,
            '@tanstack/angular-query': angularQueryEntry,
            '@tanstack/query-devtools': queryDevtoolsEntry,
          },
        }
      : {}),
  },
  plugins: [
    tsconfigPaths({ projects: ['tsconfig.prod.json'] }),
    dts({
      outDir: 'dist',
      entryRoot: './src',
      include: './src',
      exclude: ['src/__tests__'],
      tsconfigPath: 'tsconfig.prod.json',
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
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    lib: {
      entry: [
        './src/index.ts',
        './src/stub.ts',
        './src/production/index.ts',
        './src/devtools-panel/index.ts',
        './src/devtools-panel/stub.ts',
        './src/devtools-panel/production/index.ts',
      ],
      formats: ['es'],
      fileName: () => '[name].mjs',
    },
    rolldownOptions: {
      external: (id) =>
        isBuiltin(id) ||
        externalDependencies.some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})
