---
'@tanstack/query-core': major
---

Disable garbage collection timers and retries on the server by default, even with finite `gcTime` or explicit `retry` options. A long-lived server can use `timeoutManager.setTimeoutProvider()` to enable garbage collection, stale notifications, polling, and explicitly configured retries.
