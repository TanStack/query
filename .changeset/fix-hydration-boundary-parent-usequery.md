---
'@tanstack/react-query': minor
'@tanstack/preact-query': minor
---

Fix HydrationBoundary skipping server-prefetched queries when parent useQuery exists (#10145)

- Modified HydrationBoundary to filter out queries created by useQuery on the server
- Server-side useQuery creates queries with status='pending', fetchStatus='idle', data=undefined
- These queries don't have real data, so we SHOULD hydrate them
- Fixes hydration mismatch when parent useQuery renders before HydrationBoundary
- Fixes duplicate fetch issue where child useSuspenseQuery refetches despite prefetch