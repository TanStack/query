---
'@tanstack/query-core': patch
---

Refetch once more when a query is invalidated while its initial fetch is in flight, so the result of a fetch that started before the invalidation no longer satisfies it.
