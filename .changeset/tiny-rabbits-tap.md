---
'@tanstack/query-core': minor
---

Added queryHash to QueryFunctionContext, giving query functions direct access to the computed query hash. This provides first-class access to each query’s unique identifier and removes the need to manually import or recompute hashQueryKeyByOptions.
