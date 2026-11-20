---
'@tanstack/query-core': patch
---

Avoid restoring a previous selection when `select` throws for `placeholderData` after the underlying query data has been reset.
