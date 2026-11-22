---
'@tanstack/query-core': major
---

Add bounded jitter to the default retry delay for queries and mutations. Each retry waits a random duration from 80% to 100% of the exponential backoff delay, up to 30 seconds.
