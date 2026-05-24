---
"@tanstack/query-core": minor
---

feat(query-core): pass `failureCount` to `QueryCache` `onError` callback

The `onError` callback in `QueryCacheConfig` now receives a third argument `failureCount: number` indicating how many retry attempts occurred before the final failure (0 means no retries happened).

This allows differentiated error handling based on the retry count:

```ts
new QueryCache({
  onError: (error, query, failureCount) => {
    if (failureCount === 0) {
      toast.error('Request failed')
    } else {
      toast.error(`Request failed after ${failureCount} retries`)
    }
  },
})
```
