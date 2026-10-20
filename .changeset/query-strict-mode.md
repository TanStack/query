---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a query hook starting the initial fetch of its query; `event.suspense` tells suspense hooks apart) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Problems are passed to `handler`, which throws a `QueryStrictModeError` to an error boundary by default; pass a `handler` that returns, for example one that logs `event.message`, to report problems without throwing. In production it only renders `children`.
