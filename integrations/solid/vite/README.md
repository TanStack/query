# TanStack Solid Query Vite Integration

Checks that `@tanstack/solid-query` and `@tanstack/solid-query-devtools` build and type-check with Vite and `vite-plugin-solid`.

## What it checks

- `src/index.tsx` renders the app inside `QueryClientProvider` together with `SolidQueryDevtools`.
- `src/App.tsx` reads a query with `useQuery` and renders its pending, error, and success states with `Switch` and `Match`.
- `vite.config.ts` uses `vite-plugin-solid`, and `tsconfig.json` sets `jsxImportSource: "solid-js"`.
- CI runs the `build` (`vite build`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-solid-vite:build`
- `pnpm nx run @tanstack/query-integration-solid-vite:test:types`
