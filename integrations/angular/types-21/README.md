# TanStack Angular Query Angular 21 Types Integration

Checks that `@tanstack/angular-query`, `@tanstack/angular-query-devtools`, and `@tanstack/angular-query-persist-client` type-check with Angular 21's compiler.

## What it checks

- `package.json` installs Angular `^21.0.0` with TypeScript `5.9.3`, and `test:types` runs `ngc --project tsconfig.json`.
- `tsconfig.json` extends `scripts/angular-types/tsconfig.json`, which compiles `scripts/angular-types/consumer.ts` and the three packages' `src/` files (including their `.test-d.ts` files) with `strictTemplates: true`.
- `tsconfig.json` maps `paths` for `@angular/common` and `@angular/core` to this project's `node_modules`, and the three `@tanstack` packages to their source in `packages/`.
- CI runs the `test:types` script.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-angular-types-21:test:types`
