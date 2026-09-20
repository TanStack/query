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

Defined in: packages/query-core/dist-ts/src/mutationCache.d.ts:59

The event passed to a `MutationCache` subscriber. Fired whenever a mutation is added or removed
from the cache, its state is updated, or one of its observers is added, removed, or has its
options updated.
