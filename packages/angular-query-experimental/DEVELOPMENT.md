# Angular adapter development

## Subpath exports and moduleResolution: node

Many applications including NX monorepos and older Angular CLI applications still specify `moduleResolution: node` in their tsconfig.
To maintain compatibility with these applications,
exports should strictly export types from the same path as the subpath so that TypeScript can resolve the types.

### ✅ Compatible

```json
{
  "./devtools/production": {
    "types": "./devtools/production/index.d.ts",
    "default": "./devtools/index.mjs"
  }
}
```

### ❌ Not compatible: types are exported from the build directory, which is not part of the export path

```json
{
  "./devtools/production": {
    "types": "./build/devtools/production/index.d.ts",
    "default": "./devtools/index.mjs"
  }
}
```

### How are these paths correctly configured?

- tsup.config.js is configured to copy package.json and README.md to the build directory
- the production subpath exports are configured as dts entry points in tsup.config.js. Note that simply copying generated type declarations can result in incorrect relative imports.
- package.json contains `publishConfig` which overrides `exports` when publishing the package, excluding `build` in the subpath export paths.
- The build directory is published instead of the containing directory. This is configured in `scripts/publish.js`
