---
'@tanstack/vue-query': patch
---

feat(vue-query): return a reactive `state` from `useQuery` so `status === 'success'` narrows `data` without unwrapping refs. `state` keeps the status fields and leaves `refetch`, `fetchNextPage`, and `fetchPreviousPage` on the composable return
