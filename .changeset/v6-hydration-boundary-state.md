---
'@tanstack/preact-query': major
'@tanstack/react-query': major
---

`HydrationBoundary` now requires a `DehydratedState`. Pass the result of `dehydrate(queryClient)`. If the state is null or undefined, pass an empty state (`{ queries: [], mutations: [] }`) or omit the boundary.
