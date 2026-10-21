---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a query hook starting the initial fetch of its query; `event.suspense` tells suspense hooks apart) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Problems are passed to `handler`. By default, it throws a `QueryStrictModeError` to an error boundary for missing prefetches, and logs unused prefetches with `console.warn`; pass your own `handler` to filter problems, or to log or throw them instead. In production it only renders `children`.
