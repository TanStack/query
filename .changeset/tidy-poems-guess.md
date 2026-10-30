---
'@tanstack/react-query': patch
---

Make queries inside a `HydrationBoundary` replay the boundary's server-rendered state during hydration before switching to the live cache. This prevents hydration mismatches when the cache changes before browser hydration, including when a query above the boundary creates an empty cache entry or a streamed promise resolves early.
