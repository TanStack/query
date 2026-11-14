---
'@tanstack/query-core': patch
---

Keep a memoized placeholder result when `select` maps it to `undefined`, so a disabled query with `keepPreviousData` no longer loops between `pending` and `success`.
