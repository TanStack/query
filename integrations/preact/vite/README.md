# TanStack Preact Query Vite Integration

Checks that `@tanstack/preact-query` and `@tanstack/preact-query-devtools` build and type-check with Vite and Preact.

## What it checks

- `src/main.tsx` renders the app inside `QueryClientProvider` together with `PreactQueryDevtools`.
- `src/App.tsx` reads a query with `useQuery` and renders its pending, error, and success states.
- `vite.config.ts` uses `@preact/preset-vite`, and `tsconfig.json` sets `jsxImportSource: "preact"`.
- CI runs the `build` (`vite build`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-preact-vite:build`
- `pnpm nx run @tanstack/query-integration-preact-vite:test:types`
