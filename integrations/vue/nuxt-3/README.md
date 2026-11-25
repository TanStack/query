# TanStack Vue Query Nuxt 3 Integration

Checks that `@tanstack/vue-query` and `@tanstack/vue-query-devtools` build and type-check with Nuxt 3.

## What it checks

- `plugins/vue-query.ts` installs `VueQueryPlugin` with a `QueryClient`, stores `dehydrate(queryClient)` in `useState` on the server's `app:rendered` hook, and calls `hydrate` on the client's `app:created` hook.
- `app.vue` reads a query with `useQuery`, renders its pending, error, and success states, and renders `VueQueryDevtools`.
- `tsconfig.json` extends `.nuxt/tsconfig.json`.
- CI runs the `build` (`nuxt build`) and `test:types` (`nuxt typecheck`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-vue-nuxt-3:build`
- `pnpm nx run @tanstack/query-integration-vue-nuxt-3:test:types`
