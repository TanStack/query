---
'@tanstack/query-core': patch
---

When a query hydrated while pending rejects, it now retries with the `retry` and `retryDelay` an observer set, if one mounted before the promise settled. Options the observer doesn't set itself, including client defaults, keep the values the query was hydrated with. Once an observer has mounted, a hydrated infinite query's retries run its `queryFn` from the first page, instead of replaying the rejected promise.
