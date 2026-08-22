---
'@tanstack/query-core': patch
---

Release a query's retryer once its fetch settles, so the settled promise no longer keeps that fetch's raw result in memory alongside the structurally shared `state.data` (or after the query is reset or removed).
