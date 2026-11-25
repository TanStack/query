# TanStack Lit Query Vite Integration

Checks that `@tanstack/lit-query` builds and type-checks with Vite and Lit 3.

## What it checks

- `src/main.ts` extends `QueryClientProvider` as `lit-query-provider` and sets its `client` to a `QueryClient` with `retry: false`.
- `src/main.ts` defines `lit-query-app`, which reads a query with `createQueryController` and renders its pending, error, and success states. Both elements render into light DOM (`createRenderRoot` returns `this`).
- `tsconfig.json` sets `useDefineForClassFields: false`.
- CI runs the `build` (`vite build`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-lit-vite:build`
- `pnpm nx run @tanstack/query-integration-lit-vite:test:types`
