---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a query hook starting the initial fetch of its query; `event.suspense` tells suspense hooks apart) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Pass `throwOnMissingPrefetch` or `throwOnUnusedPrefetch` to throw a `QueryStrictModeError` to an error boundary instead of logging. In production it only renders `children`.
