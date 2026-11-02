---
'@tanstack/query-core': patch
---

When a query hydrated while pending rejects, it now retries with the `retry` and `retryDelay` options it has when it fails. An observer that mounts before the promise settles now decides whether and when the query retries. For an infinite query, the retry also runs that observer's `queryFn` from the first page, instead of replaying the rejected promise.
