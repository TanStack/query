---
id: QueryCacheNotifyEvent
title: QueryCacheNotifyEvent
---

```ts
type QueryCacheNotifyEvent = 
  | NotifyEventQueryAdded
  | NotifyEventQueryRemoved
  | NotifyEventQueryUpdated
  | NotifyEventQueryObserverAdded
  | NotifyEventQueryObserverRemoved
  | NotifyEventQueryObserverResultsUpdated
  | NotifyEventQueryObserverOptionsUpdated;
```

Defined in: [packages/query-core/src/queryCache.ts:85](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L85)

The event passed to a `QueryCache` subscriber. Fired whenever a query is added or removed from
the cache, its state is updated (e.g. via `query.setState` or `queryClient.removeQueries`), or
one of its observers is added, removed, or has its results or options updated.
