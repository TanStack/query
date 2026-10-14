---
'@tanstack/query-core': minor
---

Expose cache-wide fetch acceptance and tracked query-function invocation positions. Integrations can reserve positions for direct writes and read operation-local positions from cache events, query-function contexts, and observer results. `fetchSourceStarted` reports an invocation even when a custom persister or behavior ignores its result. Cached data has a `dataSourceSequence` only when Query Core controls the path from query function to result; it is the fetch's first invocation and a lower bound when the fetch retries. Opaque custom persisters and replaced fetch functions leave it undefined. `context.options` forwards writes to the Query's options, but it is a distinct view whose `queryFn` reads return a tracked wrapper. A function captured outside that context can run without a source position.
