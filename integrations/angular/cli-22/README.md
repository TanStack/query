# TanStack Angular Query Angular CLI 22 Integration

Checks that `@tanstack/angular-query` and `@tanstack/angular-query-devtools` build with Angular CLI 22.

## What it checks

- `src/app/app.config.ts` registers the client with `provideTanStackQuery(() => new QueryClient(), withDevtools())`.
- `src/app/app.ts` reads a query with `injectQuery` and renders its pending, error, and success states with `@if` blocks.
- `angular.json` builds `src/main.ts` with the `@angular/build:application` builder, using Angular 22 and TypeScript 6.
- CI runs the `build` script (`ng build`).

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-angular-cli-22:build`
