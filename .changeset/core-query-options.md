---
'@tanstack/query-core': minor
'@tanstack/vue-query': minor
---

Add framework-agnostic `queryOptions`, `infiniteQueryOptions`, and `mutationOptions` helpers. They only accept options that every adapter supports, so framework-specific options such as `throwOnError`, `suspense`, and `notifyOnChangeProps` stay in each adapter's helpers. `useQuery` and `useInfiniteQuery` from `@tanstack/vue-query` accept a getter of these options.
