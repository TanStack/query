# TanStack Vue Query Nuxt 4 Integration

Checks that `@tanstack/vue-query` and `@tanstack/vue-query-devtools` build and type-check with Nuxt 4.

## What it checks

- `app/plugins/vue-query.ts` installs `VueQueryPlugin` with a `QueryClient`, stores `dehydrate(queryClient)` in `useState` on the server's `app:rendered` hook, and calls `hydrate` on the client's `app:created` hook.
- `app/app.vue` reads a query with `useQuery`, renders its pending, error, and success states, and renders `VueQueryDevtools`.
- `tsconfig.json` references the generated `.nuxt/tsconfig.app.json`, `.nuxt/tsconfig.server.json`, `.nuxt/tsconfig.shared.json`, and `.nuxt/tsconfig.node.json`.
- CI runs the `build` (`nuxt build`) and `test:types` (`nuxt typecheck`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-vue-nuxt-4:build`
- `pnpm nx run @tanstack/query-integration-vue-nuxt-4:test:types`
