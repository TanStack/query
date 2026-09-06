---
id: WithRequired
title: WithRequired
---

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: [packages/query-core/src/types.ts:505](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L505)

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
