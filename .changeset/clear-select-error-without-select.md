---
'@tanstack/query-core': patch
---

Clear a stored `select` error when no selector applies to cached data, so removing a throwing selector returns the cached data instead of a stale error.
