---
'@tanstack/react-query': patch
'@tanstack/preact-query': patch
---

Default `TData` of `UseInfiniteQueryOptions` and `UseSuspenseInfiniteQueryOptions` to `InfiniteData<TQueryFnData>` so it matches the hook generics.
