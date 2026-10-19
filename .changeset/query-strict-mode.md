---
'@tanstack/react-query': minor
---

feat(react-query): add `QueryStrictMode`, which reports missing prefetches (a query hook starting the initial fetch of its query; `event.suspense` tells suspense hooks apart) and unused prefetches (a prefetched query nobody reads within `unusedPrefetchTimeout`) in development. Problems are passed to `handler`, which logs with `console.error` by default; throw from it, for example a `QueryStrictModeError`, to send a problem to an error boundary instead. In production it only renders `children`.
