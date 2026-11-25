# TanStack Svelte Query Vite Integration

Checks that `@tanstack/svelte-query` and `@tanstack/svelte-query-devtools` build and type-check with Vite and Svelte 5.

## What it checks

- `src/main.ts` mounts `src/App.svelte` with `mount`, and `src/App.svelte` wraps `src/Simple.svelte` in `QueryClientProvider` together with `SvelteQueryDevtools`.
- `src/Simple.svelte` reads a query with `createQuery` and renders its pending, error, and success states.
- `vite.config.ts` uses the `svelte()` plugin with `vitePreprocess()`.
- CI runs the `build` (`vite build`) and `test:types` (`svelte-check`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-svelte-vite:build`
- `pnpm nx run @tanstack/query-integration-svelte-vite:test:types`
