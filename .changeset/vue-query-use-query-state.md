---
'@tanstack/vue-query': patch
---

feat(vue-query): return a reactive `state` from `useQuery` so `status === 'success'` narrows `data` without unwrapping refs
