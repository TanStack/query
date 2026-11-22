---
"@tanstack/query-core": patch
---

Fix `QueriesObserver` returning a stale `combine` result built from the previous queries when one of them updates before `setQueries` is called with the new queries.
