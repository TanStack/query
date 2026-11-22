---
'@tanstack/query-core': major
'@tanstack/react-query': major
'@tanstack/preact-query': major
'@tanstack/vue-query': major
---

Replace `queryClient.infiniteQuery(options)` with `infiniteQuery(queryClient, options)`, imported from the adapter package or `@tanstack/query-core`. The Vue export accepts reactive options. Infinite queries keep the same cache entries and can still refetch after hydration before an observer mounts. Bundles that use only ordinary queries can omit the pagination implementation.
