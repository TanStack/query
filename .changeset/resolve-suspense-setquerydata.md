---
"@tanstack/query-core": patch
---

Resolve suspense when query data is set programmatically via setQueryData or streamedQuery. Previously, fetchOptimistic returned only the fetch promise, which left the Suspense boundary stuck until the queryFn completed — even when data already existed in the cache. The fix uses Promise.race with a cache subscriber to release suspense as soon as data becomes available.
