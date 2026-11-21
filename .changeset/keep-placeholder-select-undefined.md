---
'@tanstack/query-core': patch
---

Keep a memoized placeholder result when `select` maps it to `undefined`, so a query with `keepPreviousData` that is disabled or still loading no longer loops between `pending` and `success`.
