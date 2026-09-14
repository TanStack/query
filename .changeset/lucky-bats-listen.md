---
'@tanstack/react-query': patch
---

fix(react-query/HydrationBoundary): hydrate existing queries during SSR

`HydrationBoundary` holds back hydration of queries that are already in the cache until after the render phase, so that transitions don't update mounted observers mid-render. There is no effect phase during SSR, so those queries were never hydrated at all. A `useQuery` rendered above the boundary creates a cache entry without fetching, which was enough to make the boundary skip the prefetched data and leave a child `useSuspenseQuery` to fetch again on the server.
