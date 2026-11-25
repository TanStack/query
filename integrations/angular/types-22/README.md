# TanStack Angular Query Angular 22 Types Integration

Checks that `@tanstack/angular-query`, `@tanstack/angular-query-devtools`, and `@tanstack/angular-query-persist-client` type-check with Angular 22's compiler.

## What it checks

- `package.json` installs Angular `^22.0.0` with the catalog TypeScript (`6.0.3`), and `test:types` runs `ngc --project tsconfig.json`.
- `tsconfig.json` extends `scripts/angular-types/tsconfig.json`, which compiles `scripts/angular-types/consumer.ts` and the three packages' `src/` files (including their `.test-d.ts` files) with `strictTemplates: true`.
- `tsconfig.json` maps `paths` for `@angular/common` and `@angular/core` to this project's `node_modules`, and the three `@tanstack` packages to their source in `packages/`.
- CI runs the `test:types` script.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-angular-types-22:test:types`
