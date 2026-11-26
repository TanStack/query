---
'@tanstack/query-core': minor
---

Add framework-agnostic `queryOptions`, `infiniteQueryOptions`, and `mutationOptions` helpers. They only accept options that every adapter supports, so framework-specific options such as `throwOnError`, `suspense`, and `notifyOnChangeProps` stay in each adapter's helpers.
