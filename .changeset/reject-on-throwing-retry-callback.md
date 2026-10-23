---
'@tanstack/query-core': patch
---

Reject the query or mutation with the thrown error when a `retry` or `retryDelay` function throws, instead of leaving it stuck in a pending, fetching state forever.
