# TanStack Vue Query Vite Integration

Checks that `@tanstack/vue-query` and `@tanstack/vue-query-devtools` build and type-check with Vite and Vue 3.

## What it checks

- `src/main.ts` installs `VueQueryPlugin` on the app.
- `src/App.vue` reads a query with `useQuery`, renders its pending, error, and success states, and renders `VueQueryDevtools`.
- `vite.config.ts` uses `@vitejs/plugin-vue`.
- CI runs the `build` (`vite build`) and `test:types` (`vue-tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-vue-vite:build`
- `pnpm nx run @tanstack/query-integration-vue-vite:test:types`
