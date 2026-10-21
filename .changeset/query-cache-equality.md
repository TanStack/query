---
'@tanstack/query-core': minor
---

Add optional `equalityFn` and `hashFn` configuration to `QueryCache.queryKey` and `MutationCache.mutationKey` for custom key comparison and hashing. Extend `replaceEqualDeep` with an optional equality function for structural sharing of custom value types. Deprecate the per-query `queryKeyHashFn` option in favor of the global `QueryCache` configuration.
