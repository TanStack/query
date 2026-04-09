---
'@tanstack/query-core': patch
---

fix(query-core): use explicit `undefined` check for timer IDs so that custom `TimeoutProvider`s returning `0` as a valid timer ID are properly cleared
