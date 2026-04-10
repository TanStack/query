---
'@tanstack/query-core': patch
---

Fix bugs where hydrating queries with promises that had already resolved could cause queries to briefly and incorrectly show as pending/fetching
