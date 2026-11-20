---
'@tanstack/solid-query': patch
---

fix(solid-query/useBaseQuery): read result fields from the resolved resource on the server so fields other than 'data' are not stuck in 'pending'
