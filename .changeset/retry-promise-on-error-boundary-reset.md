---
'@tanstack/query-core': patch
'@tanstack/react-query': patch
---

fix(react-query): retry `useQuery().promise` on error boundary reset

Recreate the query promise when a retry transitions the query back to fetching so `useQuery().promise` hands a fresh pending promise to Suspense, and explicitly refetch active, enabled errored queries when a `QueryErrorResetBoundary` is reset.
