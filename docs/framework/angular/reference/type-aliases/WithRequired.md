---
id: WithRequired
title: WithRequired
---

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: [packages/query-core/src/types.ts:516](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L516)

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
