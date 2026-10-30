---
'@tanstack/solid-query': patch
---

fix(solid-query/QueryClient): exclude 'reconcile' from 'TData' inference so inline 'queryOptions' and 'infiniteQueryOptions' infer 'data'
