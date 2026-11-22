---
'@tanstack/query-core': major
---

Add optional `equalityFn` and `hashFn` configuration to `QueryCache.queryKey` and `MutationCache.mutationKey` for custom key comparison and hashing. Extend `replaceEqualDeep` with an optional equality function for structural sharing of custom value types. Remove the per-query `queryKeyHashFn` option and the `QueryKeyHashFunction` type. Configure `new QueryCache({ queryKey: { hashFn } })` on the client to customize hashing. To apply different hashes to different queries, branch on the key inside `hashFn` and use `hashKey` for the default.

Partial key matching now recurses only into plain arrays and objects. Use `equalityFn` to compare values such as `Date` instances. The third argument to `replaceEqualDeep` now accepts an equality function. The recursion depth is managed internally.
