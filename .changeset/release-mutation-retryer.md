---
'@tanstack/query-core': patch
---

Release a mutation's retryer once `execute()` settles, so the settled promise no longer keeps the raw mutation result in memory alongside `state.data` for the mutation's lifetime. Mirrors the same fix applied to `Query.fetch()` in #11163.
