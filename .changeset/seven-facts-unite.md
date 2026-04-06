---
'@tanstack/query-core': patch
---

fix: use !== undefined instead of truthy check for timer IDs to correctly handle falsy value 0 in clearGcTimeout,  

