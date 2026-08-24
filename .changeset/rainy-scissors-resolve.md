---
'@tanstack/query-core': patch
'@tanstack/react-query': patch
---

fix(query-core): avoid React hydration mismatches when a query hydrated from a dehydrated promise resolves synchronously on the client. The observer now exposes a server snapshot that re-renders the pending view the server saw, and `useBaseQuery` renders from `useSyncExternalStore` so the hydration pass stays consistent with the server HTML (#9399)
