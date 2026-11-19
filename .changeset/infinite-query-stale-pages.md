---
'@tanstack/query-core': patch
---

Refetch cached pages using their existing `pageParams` when an infinite query is refetched without `getNextPageParam`.
