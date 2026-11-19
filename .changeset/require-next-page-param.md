---
"@tanstack/query-core": patch
---

Require `getNextPageParam` in the types for `queryClient.infiniteQuery`, the deprecated infinite query methods, and `usePrefetchInfiniteQuery`. If you omit `pages`, a stale query can still refetch multiple cached pages and needs the callback to compute their page parameters. Reuse the same `infiniteQueryOptions` you pass to `useInfiniteQuery` to supply the callback.
