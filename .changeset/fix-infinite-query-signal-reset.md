---
'@tanstack/query-core': patch
---

Reset signal consumption for each new infinite-query fetch. A previous fetch that read the signal no longer causes a later fetch that ignores it to be cancelled on unmount.
