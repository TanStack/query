---
"@tanstack/query-core": patch
---

Optimize `find`/`findAll` lookups in `QueryCache` and `MutationCache` by using index maps for O(1) key-based access when `exact: true` and a key filter are provided, instead of iterating all entries.
