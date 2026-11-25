# TanStack Solid Query SolidStart 2 Integration

Checks that `@tanstack/solid-query` and `@tanstack/solid-query-devtools` build and type-check with SolidStart 2.

## What it checks

- `src/app.tsx` renders `QueryClientProvider` with `SolidQueryDevtools`, and reads a query with `useQuery` and renders its states with `Switch` and `Match`.
- `src/entry-client.tsx` mounts `StartClient`, and `src/entry-server.tsx` renders the document with `StartServer` and `createHandler`.
- `vite.config.ts` uses the `solidStart()` and `nitro()` Vite plugins.
- CI runs the `build` (`vite build`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-solid-solid-start-2:build`
- `pnpm nx run @tanstack/query-integration-solid-solid-start-2:test:types`
