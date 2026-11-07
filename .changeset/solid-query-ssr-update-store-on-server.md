---
'@tanstack/solid-query': patch
---

fix(solid-query): update the query result on the server so fields other than `data` (e.g. `status`, `isFetching`, `hasNextPage`) are not stuck in the pending state during SSR
