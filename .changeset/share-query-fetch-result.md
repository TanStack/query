---
'@tanstack/query-core': patch
---

Keep all callers of an in-flight query waiting for the replacement fetch when invalidation cancels it, including after repeated invalidations.
