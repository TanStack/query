---
'@tanstack/query-core': minor
'@tanstack/vue-query': minor
---

Read cached data when an explicit `queryFn: skipToken` reaches `queryClient.query` or `queryClient.infiniteQuery`. A skipped call returns cached data regardless of freshness, or `undefined` when the cache has no data. It does not start a fetch or wait for one. If the options type allows `skipToken`, the result type includes `undefined`.
