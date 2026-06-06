---
'@tanstack/query-core': patch
---

Fix `dataUpdatedAt` not being updated for streamed queries that resolve before hydration. When a dehydrated pending query's promise resolves synchronously during hydration, the query correctly transitions to `success` but `dataUpdatedAt` remained `0`. Now it is set to `Date.now()` in this case.
