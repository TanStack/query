---
'@tanstack/query-core': patch
---

Retry a query that was hydrated while pending and then rejects with the `retry` and `retryDelay` options that are current when it fails. An observer that mounts before the hydrated promise settles now decides whether and when it is retried, instead of the options the query had when it was hydrated.
