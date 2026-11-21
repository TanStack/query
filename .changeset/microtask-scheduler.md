---
'@tanstack/query-core': major
'@tanstack/query-persist-client-core': patch
---

Schedule query notifications in a microtask by default so they can batch with other updates in the same event loop turn. To keep the v5 timing, use `notifyManager.setScheduler((callback) => setTimeout(callback, 0))`.

The query persister waits for the query to apply fetched or restored data before it saves state or refetches.
