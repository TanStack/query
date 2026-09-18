---
id: WithRequired
title: WithRequired
---

```ts
type WithRequired<TTarget, TKey> = TTarget & { [_ in TKey]: {} };
```

Defined in: [packages/query-core/src/types.ts:537](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L537)

## Type Parameters

### TTarget

`TTarget`

### TKey

`TKey` *extends* keyof `TTarget`
