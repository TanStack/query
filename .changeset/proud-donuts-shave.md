---
"@tanstack/query-persist-client-core": patch
---

Validate persisted query keys, hashes, state objects, and data update timestamps before retrieval, restoration, garbage collection, or filtered removal. Remove malformed entries without interrupting subsequent queries, while preserving valid `null` data.
