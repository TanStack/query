---
id: WithRequired
title: WithRequired
---

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: [packages/query-core/src/types.ts:657](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L657)

Makes the `TKey` properties of `TTarget` required and non-nullable.

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
