---
'@tanstack/solid-query': patch
---

Skip `reconcile` invocations when the incoming `result.data` reference is identical to the current store data. Previously `reconcile` (and any user-provided callback) could be called multiple times per query update for fetching state transitions where the data reference had not changed. Fixes #8873.
