---
'@tanstack/query-core': patch
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
'@tanstack/vue-query': patch
---

Fix `QueryClient.isMutating` and `useIsMutating` silently discarding a caller-provided `status` filter. They now honour the filter when one is given and default to `'pending'` otherwise.
