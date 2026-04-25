---
'@tanstack/query-core': patch
---

fix(query-core): allow `persister` to contribute to `TQueryFnData` inference so a `queryFn` that declares a parameter no longer produces a spurious overload mismatch against a typed persister (#7842).
