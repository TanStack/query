---
'@tanstack/query-core': patch
---

Ignore a retained `pendingThenable` settlement callback invoked after the thenable has settled. Holding a reference to `resolve`/`reject` and calling it later used to overwrite `status` and `reason` even though the underlying promise had already settled, leaving the thenable advertising a state that disagreed with its value.
