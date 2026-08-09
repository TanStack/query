---
'@tanstack/query-core': patch
---

fix(query-core): clear a stale `select` error when the observer switches to a query without data, so the previous query's select error no longer leaks into the new pending result
