# TanStack React Query Vite Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build and type-check with Vite and React 19.

## What it checks

- `src/main.tsx` renders the app inside `React.StrictMode` and `QueryClientProvider` together with `ReactQueryDevtools`.
- `src/App.tsx` reads a query with `useQuery` and renders its pending, error, and success states.
- `vite.config.ts` uses `@vitejs/plugin-react`.
- CI runs the `build` (`vite build`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-vite:build`
- `pnpm nx run @tanstack/query-integration-react-vite:test:types`
