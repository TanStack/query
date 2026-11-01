---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a query hook starting the initial fetch of its query; `event.suspense` tells suspense hooks apart) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Missing prefetches are passed to `handleMissingPrefetch`, which throws a `QueryStrictModeMissingPrefetchError` to an error boundary by default. Unused prefetches are passed to `handleUnusedPrefetch`, which logs them with `console.warn` by default. Pass your own handlers to filter problems, or to log or throw them instead; `QueryStrictModeUnusedPrefetchError` is available for throwing unused prefetches, and both errors extend `QueryStrictModeError`. In production it only renders `children`.
