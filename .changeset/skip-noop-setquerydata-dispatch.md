---
'@tanstack/query-core': patch
---

perf(query-core): skip redundant success dispatch in `setQueryData` when updater returns referentially identical data with `{ manual: true }`
