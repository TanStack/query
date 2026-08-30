---
'@tanstack/query-core': minor
'@tanstack/query-persist-client-core': minor
---

Add cache-level value serialization and hashing for query and mutation keys.

Configure `valueSerializer` and `hashFn` on `QueryCache` or `MutationCache` to use custom key values consistently in cache identity, filters, defaults, and fine-grained persistence filters. The existing per-query `queryKeyHashFn` option is now deprecated.
