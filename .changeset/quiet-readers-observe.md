---
'@tanstack/query-core': minor
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
'@tanstack/lit-query': patch
---

Add observer result readers. Each reader captures its query options. React and Preact query hooks now read stable snapshots through `useSyncExternalStore` without replacing the committed observer result or selection state during render. Optimistic fetch states retain their result reference when fetching starts.

`getOptimisticResult` now reads through a result reader without changing the observer's stored result. Lit query controllers request an update when their initial result is assigned, so controllers added to an existing host display cached data even when the result reference is unchanged.

React and Preact `useQueries` also use result readers, including local combine caches. Deprecate `getOptimisticResult` in favor of `createResultReader`.
