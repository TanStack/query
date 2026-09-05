---
'@tanstack/query-core': patch
---

fix(query-core): stop orphaned streamedQuery chunks from corrupting the cache after a refetch when the streamFn doesn't consume the signal
