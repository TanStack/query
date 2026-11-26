---
'@tanstack/query-core': patch
---

fix(query-core/query): keep garbage collecting an unobserved query after it is reset instead of leaving it in the cache without a timer
