---
'@tanstack/query-core': patch
---

When a query that `hydrate` resumed while pending rejects, its retries now use the `retry` and `retryDelay` options the query has at that moment. An observer that mounts before the promise settles now decides whether and when the query retries, not the options from hydration.
