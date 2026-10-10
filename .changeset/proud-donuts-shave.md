---
"@tanstack/query-persist-client-core": patch
---

Validate persisted query keys, hashes, busters, data, and timestamps before retrieval, restoration, garbage collection, or filtered removal. Remove malformed entries without interrupting subsequent queries, while preserving valid `null` data.
