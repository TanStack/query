# TanStack Query Angular SSR + persistence example

Combines [SSR/hydration](https://tanstack.com/query/latest/docs/framework/angular/guides/ssr), a `localStorage` persister, and a **client-only island**: `ClientPersistDemoComponent` is mounted with `afterNextRender`, so its `injectQuery` `queryFn` does not run during SSR (unlike `@defer` main content, which is still rendered on the server for incremental hydration).

- **Server:** same bootstrap config shape as the base SSR example; `withPersistQueryClient` uses a factory and skips work when not in the browser.
- **Client:** `showClientDemo` is set to `true` in `afterNextRender`, then `<client-persist-demo />` is created — optional `dehydrateOptions.shouldDehydrateQuery` can scope persistence to `client-persist` query keys only.

To run:

- From the repo root: `pnpm install` then  
  `pnpm --filter @tanstack/query-example-angular-ssr-persist start`
- Production SSR server after build:  
  `pnpm --filter @tanstack/query-example-angular-ssr-persist run build`  
  then `pnpm --filter @tanstack/query-example-angular-ssr-persist run serve:ssr`
