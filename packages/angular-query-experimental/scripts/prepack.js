import { link, mkdir } from 'fs/promises'
import { dirname, relative } from 'path'
import fg from 'fast-glob'

const constants = {
  DIST_TYPES_DIRECTORY: 'dist/types',
  OUTPUT_DIRECTORY: '.',
  DIST_TYPE_FILES_GLOB: 'dist/types/**/*.d.ts',
}

/*
`prepack` lifecycle script which links type declaration files from the dist folder to the package root.
allows using types in package exports as such:

`"types": "./index.d.ts"`

and subpath exports

```json
    "./some-subpath": {
      "types": "./some-subpath/index.d.ts", // ✅ works with `"modeResolution": "node"`
      "default": "./build/some-subpath/index.mjs"
    },
```

When TypeScript is configured with `moduleResolution: node`, type declaration file directory structures are expected
to exactly match the subpath export as in the example above.

```json
    "./some-subpath": {
      "types": "./build/dist/some-subpath/index.d.ts", // ❌ does not work with `"moduleResolution": "node"`
      "default": "./build/some-subpath/index.mjs"
    },
```

It's important to support `"moduleResolution": "node"` as many Angular applications are configured this way.
Also, NX adds it to the out of box `tsconfig`

In the `postpack` lifecycle script these links are removed to keep a clean development environment
 */
async function prepack() {
  console.log('Running prepack script to prepare types for publishing')

  const typeFiles = await fg([constants.DIST_TYPE_FILES_GLOB])
  if (typeFiles.length === 0) return

  const destDirs = [
    ...new Set(
      typeFiles
        .map((file) => {
          const dest = relative(constants.DIST_TYPES_DIRECTORY, file)
          return dirname(dest)
        })
        .filter((dir) => dir !== constants.OUTPUT_DIRECTORY),
    ),
  ]

  await Promise.all(destDirs.map((dir) => mkdir(dir, { recursive: true })))
  await Promise.all(
    typeFiles.map((file) => {
      const dest = relative(constants.DIST_TYPES_DIRECTORY, file)
      return link(file, dest)
    }),
  )

  console.log(`Linked ${typeFiles.length} type files`)
}

prepack().catch(console.error)
