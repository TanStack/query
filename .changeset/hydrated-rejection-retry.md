---
'@tanstack/query-core': patch
---

When a query hydrated while pending rejects, it now retries with its current `retry` and `retryDelay` options, so an observer that mounted before the promise settled decides whether and when it retries.
