---
'@tanstack/query-core': patch
---

Pass query options to optimistic fetches so Suspense queries can fetch after the cache entry is recreated without a query function, such as by `broadcastQueryClient`.
