# TanStack Svelte Query SvelteKit 2 Integration

Checks that `@tanstack/svelte-query` and `@tanstack/svelte-query-devtools` build and type-check with SvelteKit 2 and Svelte 5.

## What it checks

- `src/routes/+layout.svelte` wraps the page in `QueryClientProvider` together with `SvelteQueryDevtools`.
- `src/routes/+page.svelte` reads a query with `createQuery` and renders its pending, error, and success states.
- `vite.config.ts` passes `vitePreprocess()` and `@sveltejs/adapter-auto` to the `sveltekit()` plugin.
- CI runs the `build` (`vite build`) and `test:types` (`svelte-kit sync && svelte-check`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-svelte-sveltekit-2:build`
- `pnpm nx run @tanstack/query-integration-svelte-sveltekit-2:test:types`
