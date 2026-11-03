---
'@tanstack/query-core': patch
---

When a query hydrated while pending rejects, its retries now take `retry` and `retryDelay` from the options an observer set itself, if one mounted before the promise settled. Otherwise they use the hydration options, and then the client's defaults, as before.
