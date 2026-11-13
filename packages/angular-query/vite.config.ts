import { isBuiltin } from 'node:module'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import packageJson from './package.json' with { type: 'json' }

function ensureImportFileExtension({
  content,
  extension,
}: {
  content: string
  extension: string
}) {
  // replace e.g. `import { foo } from './foo'` with `import { foo } from './foo.js'`
  content = content.replace(
    /(im|ex)port\s[\w{}/*\s,]+from\s['"](?:\.\.?\/)+?[^'"]+(?=['"];?)/gm,
    (specifier) =>
      /\.(?:[cm]?js|json)$/.test(specifier)
        ? specifier
        : `${specifier}.${extension}`,
  )

  // replace e.g. `import('./foo')` with `import('./foo.js')`
  content = content.replace(
    /import\(['"](?:\.\.?\/)+?[^'"]+(?=['"];?)/gm,
    (specifier) =>
      /\.(?:[cm]?js|json)$/.test(specifier)
        ? specifier
        : `${specifier}.${extension}`,
  )
  return content
}

const externalDependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
})

export default defineConfig({
  // fix from https://github.com/vitest-dev/vitest/issues/6992#issuecomment-2509408660
  resolve: {
    conditions: ['@tanstack/custom-condition'],
  },
  plugins: [
    tsconfigPaths({ projects: ['tsconfig.prod.json'] }),
    dts({
      outDir: 'dist',
      entryRoot: './src',
      include: './src',
      exclude: ['src/**/__tests__/**', 'src/**/__test__/**'],
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
      entry: ['./src/index.ts', './src/internal.ts'],
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
