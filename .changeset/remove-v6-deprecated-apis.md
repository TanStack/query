---
'@tanstack/angular-query-devtools': major
'@tanstack/preact-query-devtools': major
'@tanstack/query-core': major
'@tanstack/query-devtools': major
'@tanstack/react-query-devtools': major
'@tanstack/solid-query': major
'@tanstack/solid-query-devtools': major
'@tanstack/svelte-query-devtools': major
'@tanstack/vue-query': major
'@tanstack/vue-query-devtools': major
---

Remove deprecated APIs for v6.

- Use `queryClient.query` or `queryClient.infiniteQuery` for imperative fetches. Add `.catch(noop)` to ignore fetch errors. Use `.then(noop).catch(noop)` if the caller needs a `Promise<void>`. Set `staleTime: 'static'` to return cached data whenever it is available. To replace `revalidateIfStale`, read the cache with `getQueryData` and start a background fetch with the desired `staleTime` if data is available.
- Use `isLoading` in place of `isInitialLoading`. Pass the fetch direction in `pageParam` if the query function needs it.
- Use `error instanceof CancelledError` and `environmentManager.isServer()`.
- Remove `suspense` from Solid Query options. Read `data` inside a `Suspense` boundary to suspend while the query loads. Set `throwOnError: true` to send query errors to an error boundary.
- Remove `styleNonce` from Devtools options.
- Replace `@tanstack/query-sync-storage-persister` with `@tanstack/query-async-storage-persister`. The async persister accepts synchronous storage such as `localStorage`.
- Vue Query requires Vue 3.3 or later and imports directly from `vue`. If you passed an options getter to `fetchQuery`, call the getter before passing its options to `queryClient.query`.
