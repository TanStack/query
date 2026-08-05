---
'@tanstack/angular-query-experimental': minor
'@tanstack/preact-query': minor
'@tanstack/query-core': minor
'@tanstack/react-query': minor
'@tanstack/solid-query': minor
'@tanstack/svelte-query': minor
---

`placeholderData` functions now receive a third argument holding the `client`, the `queryKey` and the `meta` of the Query, so a `queryOptions` factory can seed from the cache without being given a `QueryClient`.
