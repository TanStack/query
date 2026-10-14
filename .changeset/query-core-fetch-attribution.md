---
'@tanstack/query-core': minor
---

Expose cache-wide fetch acceptance and tracked query-function invocation positions. Integrations can reserve positions for direct writes and read operation-local positions from cache events, query-function contexts, and observer results. Custom behaviors must invoke `context.fetchFn` or `context.options.queryFn` for source attribution. `context.options` forwards writes to the Query's options, but it is a distinct view whose `queryFn` reads return a stable tracked wrapper. A function captured outside that context can run without a source position; an absent source position means Query Core did not track an invocation.
