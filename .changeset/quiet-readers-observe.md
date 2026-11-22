---
'@tanstack/query-core': minor
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
'@tanstack/lit-query': patch
---

Add `createResultReader` to query observers. React and Preact use readers to get stable snapshots through `useSyncExternalStore`. During render, readers keep their results and selection state separate from the observer. Readers for multiple queries also cache the combined result. An optimistic result keeps its reference when fetching starts if its fields stay the same.

Lit query controllers request an update when they receive their initial result. This lets controllers added to an existing host display cached data.
