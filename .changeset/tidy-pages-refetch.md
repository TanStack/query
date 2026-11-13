---
'@tanstack/query-core': patch
---

Reuse cached `pageParams` when refetching an infinite query that has no `getNextPageParam`, instead of throwing `TypeError: options.getNextPageParam is not a function`.
