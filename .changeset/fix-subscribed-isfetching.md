---
'@tanstack/react-query': patch
---

Fix `isFetching` reporting `true` when `subscribed: false` and no fetch is actually running. `useBaseQuery` and `useQueries` no longer apply the `optimistic` fetching state when the observer will not subscribe, so `isFetching` and `fetchStatus` now stay consistent with the underlying query cache.
