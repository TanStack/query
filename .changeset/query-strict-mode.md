---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a suspense hook starting its fetch during render) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Pass `throwOnMissingPrefetch` or `throwOnUnusedPrefetch` to throw a `QueryStrictModeError` to an error boundary instead of logging. In production it only renders `children`.
