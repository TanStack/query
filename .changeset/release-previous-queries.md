---
'@tanstack/query-core': patch
---

Fix `QueriesObserver.setQueries` (used by `useQueries`) keeping the queries it replaced, and their data, in memory after they are removed from the cache.
