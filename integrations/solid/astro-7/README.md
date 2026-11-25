# TanStack Solid Query Astro 7 Integration

Checks that `@tanstack/solid-query` and `@tanstack/solid-query-devtools` build and type-check with Astro 7 and `@astrojs/solid-js`.

## What it checks

- `src/pages/index.astro` renders the Solid `App` component with `client:load`.
- `src/components/App.tsx` renders `QueryClientProvider` with `SolidQueryDevtools`, and reads a query with `useQuery` inside `ErrorBoundary` and `Suspense`.
- `astro.config.ts` adds the `solidJs()` integration, and `tsconfig.json` extends `astro/tsconfigs/strict` with `jsxImportSource: "solid-js"`.
- CI runs the `build` (`astro build`) and `test:types` (`astro check`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-solid-astro-7:build`
- `pnpm nx run @tanstack/query-integration-solid-astro-7:test:types`
