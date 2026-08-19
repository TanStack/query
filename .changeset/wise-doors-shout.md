---
'@tanstack/lit-query': patch
---

Brand the `queryKey` returned by `infiniteQueryOptions` with `DataTag` so `getQueryData` and `setQueryData` infer `InfiniteData` instead of `unknown`.
