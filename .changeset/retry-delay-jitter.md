---
'@tanstack/query-core': major
---

Add jitter to the default retry delay for queries and mutations. Each retry uses a random delay from 10 ms to the exponential backoff limit, which starts at 1 second and doubles up to 30 seconds.

To keep the previous retry schedule, set `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)`.
