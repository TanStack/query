---
'@tanstack/query-core': minor
---

Add `enforceQueryGcTime` to `QueryClientConfig` to force `gcTime` for all queries created by a client.

When provided, this value overrides `gcTime` from:
- `defaultOptions.queries`
- `setQueryDefaults`
- per-query options passed to query methods
