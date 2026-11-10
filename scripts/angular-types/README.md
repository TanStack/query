# Angular compiler compatibility

The `types-20`, `types-21`, and `types-22` projects under `integrations/angular`
run Angular's compiler with supported Angular/TypeScript pairs: 20.1/5.8, 21/5.9,
and 22/6.0. They check the three Angular packages' source, the adapter's existing
`.test-d.ts` fixtures, and a shared consumer with a strictly checked template.

Each project's `paths` select its own Angular installation, including imports
from the shared package source. Without those mappings, TypeScript would resolve
the Angular 22 development dependencies beside the packages instead of the
Angular version under test. Framework-independent dependencies use their built
declarations; Nx builds those dependencies before running the check.

Run all three checks from the repository root:

```sh
pnpm nx run-many --target=test:types --projects='@tanstack/query-integration-angular-types-*'
```

Runtime tests and the package-local type checks continue to use the default
Angular 22/TypeScript 6 toolchain. Unsupported TypeScript previews remain in the
framework-independent packages' matrix, not the Angular projects.
