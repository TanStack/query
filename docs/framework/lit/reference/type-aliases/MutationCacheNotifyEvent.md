---
id: MutationCacheNotifyEvent
title: MutationCacheNotifyEvent
---

```ts
type MutationCacheNotifyEvent =
  | NotifyEventMutationAdded
  | NotifyEventMutationRemoved
  | NotifyEventMutationObserverAdded
  | NotifyEventMutationObserverRemoved
  | NotifyEventMutationObserverOptionsUpdated
  | NotifyEventMutationUpdated;
```

Defined in: [packages/query-core/src/mutationCache.ts:98](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L98)

The event passed to a `MutationCache` subscriber. Fired whenever a mutation is added or removed
from the cache, its state is updated, or one of its observers is added, removed, or has its
options updated.
