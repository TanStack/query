---
'@tanstack/query-core': patch
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
'@tanstack/solid-query': patch
'@tanstack/svelte-query': patch
'@tanstack/vue-query': patch
'@tanstack/angular-query-experimental': patch
'@tanstack/lit-query': patch
---

Exclude `fetchStatus` from the filters accepted by `QueryClient.isFetching`, `useIsFetching`, and `injectIsFetching`. These APIs always count queries with `fetchStatus: 'fetching'`.
