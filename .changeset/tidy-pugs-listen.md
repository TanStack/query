---
'@tanstack/preact-query': patch
---

Hydrate queries nobody is observing as soon as `HydrationBoundary` commits, so a `useQuery` that remounts under it no longer refetches data the dehydrated state already contains.
