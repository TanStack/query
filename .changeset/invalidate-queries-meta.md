---
"@tanstack/query-core": minor
---

Forward caller-provided `meta` from `invalidateQueries` options into the `invalidate` action payload visible in `queryCache.subscribe`.

```ts
queryClient.invalidateQueries(
  { queryKey: ['orders'] },
  { meta: { source: 'websocket', traceId: 'abc123' } },
)

queryCache.subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'invalidate') {
    console.log(event.action.meta) // { source: 'websocket', traceId: 'abc123' }
  }
})
```
