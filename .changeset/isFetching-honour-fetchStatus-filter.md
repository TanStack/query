---
'@tanstack/query-core': patch
---

Fix `QueryClient.isFetching` (and `useIsFetching`) silently discarding a caller-provided `fetchStatus` filter. It now honours the filter when one is given and still defaults to `'fetching'` otherwise.
