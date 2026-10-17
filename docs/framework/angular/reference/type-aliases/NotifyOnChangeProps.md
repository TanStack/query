---
id: NotifyOnChangeProps
title: NotifyOnChangeProps
---

```ts
type NotifyOnChangeProps = 
  | keyof InfiniteQueryObserverResult[]
  | "all"
  | undefined
  | (() => 
  | keyof InfiniteQueryObserverResult[]
  | "all"
  | undefined);
```

Defined in: packages/query-core/src/types.ts:342
